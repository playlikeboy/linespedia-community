"use client";

import * as React from "react";
import Link from "next/link";
import { getEmotionBadgeStyles } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Heart, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser, useHexclaveApp } from "@hexclave/next";
import { toast } from "sonner";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string;
    primaryEmotion: string;
    secondaryEmotion?: string | null;
    language: string;
    readingTime: number;
    views: number;
    createdAt: string | Date;
    reactions?: Record<string, number> | null;
    userReaction?: string | null;
    isBookmarked?: boolean;
    author: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    };
  };
}

function getPlainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function PostCard({ post }: PostCardProps) {
  const totalReactions = post.reactions
    ? Object.values(post.reactions).reduce((a, b) => a + b, 0)
    : 0;
  const plainText = getPlainText(post.content);
  const preview = plainText.length > 190
    ? plainText.slice(0, 190).trimEnd() + "…"
    : plainText;

  return (
    <article className="group border-y border-border/55 bg-card/30 px-4 py-6 sm:px-6 md:py-7 hover:bg-card/65">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={"/profile/" + post.author.username}
            aria-label={"View " + (post.author.displayName || post.author.username) + "'s profile"}
          >
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src={post.author.avatar || ""} alt="" />
              <AvatarFallback className="bg-muted text-[10px] font-semibold">
                {post.author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <Link
                href={"/profile/" + post.author.username}
                className="font-semibold text-foreground hover:text-accent"
              >
                {post.author.displayName || post.author.username}
              </Link>
              <span aria-hidden="true">·</span>
              <span>@{post.author.username}</span>
            </div>
            <time
              dateTime={new Date(post.createdAt).toISOString()}
              className="text-[11px] text-muted-foreground/70"
            >
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </time>
          </div>
        </div>

        <Badge
          variant="outline"
          className={
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium capitalize " +
            getEmotionBadgeStyles(post.primaryEmotion)
          }
        >
          {post.primaryEmotion}
        </Badge>
      </div>

      <Link
        href={"/post/" + post.slug}
        className="mt-5 block rounded-xl focus-visible:outline-none"
      >
        <h2 className="font-display text-[1.65rem] leading-[1.08] tracking-[-0.025em] text-foreground transition-colors group-hover:text-accent sm:text-[1.8rem]">
          {post.title}
        </h2>
        <p className="reader-text mt-3 max-w-2xl text-[1.18rem] text-muted-foreground">
          {preview}
        </p>
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/30 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.secondaryEmotion && (
            <span className="rounded-full border border-border/50 bg-background/40 px-2.5 py-1 text-[10px] font-medium capitalize text-muted-foreground">
              {post.secondaryEmotion}
            </span>
          )}
          <span className="rounded-full border border-border/50 bg-background/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {post.language}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <PostCardReactionButton
            writingId={post.id}
            initialReactions={post.reactions || {}}
            initialUserReaction={post.userReaction}
          />
          <PostCardSaveButton
            writingId={post.id}
            initialBookmarked={Boolean(post.isBookmarked)}
          />
          <span className="inline-flex items-center gap-1" title="Reading time">
            <Clock className="h-3.5 w-3.5" />
            {post.readingTime} min
          </span>
          <span className="inline-flex items-center gap-1" title="Views">
            <Eye className="h-3.5 w-3.5" />
            {post.views}
          </span>
        </div>
      </div>
    </article>
  );
}

function PostCardReactionButton({
  writingId,
  initialReactions,
  initialUserReaction,
}: {
  writingId: string;
  initialReactions: Record<string, number>;
  initialUserReaction?: string | null;
}) {
  const hexclaveUser = useUser();
  const hexclaveApp = useHexclaveApp();
  const [reactions, setReactions] = React.useState(initialReactions);
  const [userReaction, setUserReaction] = React.useState<string | null>(initialUserReaction || null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleReact = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hexclaveUser) {
      toast("Sign in to react to writings", {
        action: {
          label: "Sign in",
          onClick: () => hexclaveApp.redirectToSignIn(),
        },
      });
      return;
    }

    if (isSubmitting) return;

    const type = "felt_this";
    const previous = { reactions, userReaction };
    const next = { ...reactions };

    if (userReaction) {
      next[userReaction] = Math.max(0, (next[userReaction] || 1) - 1);
    }

    if (userReaction === type) {
      setUserReaction(null);
    } else {
      setUserReaction(type);
      next[type] = (next[type] || 0) + 1;
    }

    setReactions(next);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/writings/" + writingId + "/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) throw new Error("reaction failed");
    } catch {
      setReactions(previous.reactions);
      setUserReaction(previous.userReaction);
      toast.error("Could not update reaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const active = userReaction === "felt_this";
  const total = Object.values(reactions).reduce((sum, value) => sum + value, 0);

  return (
    <button
      type="button"
      onClick={handleReact}
      disabled={isSubmitting}
      aria-label={active ? "Remove reaction" : "React to this writing"}
      aria-pressed={active}
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 hover:bg-muted hover:text-foreground " +
        (active ? "text-accent" : "")
      }
    >
      <Heart className={"h-3.5 w-3.5 " + (active ? "fill-current" : "")} />
      <span>{total || "React"}</span>
    </button>
  );
}

function PostCardSaveButton({
  writingId,
  initialBookmarked = false,
}: {
  writingId: string;
  initialBookmarked?: boolean;
}) {
  const hexclaveUser = useUser();
  const hexclaveApp = useHexclaveApp();
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleBookmark = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hexclaveUser) {
      toast("Sign in to save writings", {
        action: {
          label: "Sign in",
          onClick: () => hexclaveApp.redirectToSignIn(),
        },
      });
      return;
    }

    if (isSubmitting) return;

    const previous = bookmarked;
    setBookmarked(!previous);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/writings/" + writingId + "/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName: "All" }),
      });

      if (!response.ok) throw new Error("bookmark failed");
    } catch {
      setBookmarked(previous);
      toast.error("Could not update save status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBookmark}
      disabled={isSubmitting}
      aria-label={bookmarked ? "Remove saved writing" : "Save writing"}
      aria-pressed={bookmarked}
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 hover:bg-muted hover:text-foreground " +
        (bookmarked ? "text-accent" : "")
      }
    >
      <Bookmark className={"h-3.5 w-3.5 " + (bookmarked ? "fill-current" : "")} />
      <span>{bookmarked ? "Saved" : "Save"}</span>
    </button>
  );
}
