"use client";

import Link from "next/link";
import { getEmotionBadgeStyles } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Smile } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
    reactions?: Record<string, number> | null;\n    userReaction?: string | null;\n    isBookmarked?: boolean;
    author: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    };
  };
}



export function PostCard({ post }: PostCardProps) {
  const totalReactions = post.reactions
    ? Object.values(post.reactions).reduce((a, b) => a + b, 0)
    : 0;

  // Clean HTML tags to show a plain text preview
  const plainTextPreview = post.content
    .replace(/<[^>]*>/g, "")
    .slice(0, 160) + (post.content.length > 160 ? "..." : "");

  return (
    <article className="border-y border-border/60 bg-background/35 px-4 py-6 sm:px-6 sm:py-7 transition-colors group duration-200 hover:bg-background/60">
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/profile/${post.author.username}`}>
          <Avatar className="h-7 w-7">
            <AvatarImage src={post.author.avatar || ""} />
            <AvatarFallback className="text-[10px]">
              {post.author.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-wrap items-baseline gap-1.5 text-xs text-muted-foreground">
          <Link href={`/profile/${post.author.username}`} className="font-medium text-foreground hover:underline">
            {post.author.displayName || post.author.username}
          </Link>
          <span>&middot;</span>
          <span>@{post.author.username}</span>
          <span>&middot;</span>
          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      <Link href={`/post/${post.slug}`} className="block group-hover:translate-x-0.5 transition-transform duration-200">
        <h2 className="font-display text-2xl md:text-[1.7rem] font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors mb-2">
          {post.title}
        </h2>
        <p className="font-reading text-lg leading-relaxed text-muted-foreground mb-5 line-clamp-4">
          {plainTextPreview}
        </p>
      </Link>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/20">
        <div className="flex gap-2">
          <Badge variant="outline" className={`text-[10px] capitalize font-mono py-0.5 px-2 ${getEmotionBadgeStyles(post.primaryEmotion)}`}>
            {post.primaryEmotion}
          </Badge>
          {post.secondaryEmotion && (
            <Badge variant="outline" className={`text-[10px] capitalize font-mono py-0.5 px-2 ${getEmotionBadgeStyles(post.secondaryEmotion)}`}>
              {post.secondaryEmotion}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
          <PostCardReactionButton writingId={post.id} initialReactions={post.reactions || {}} initialUserReaction={post.userReaction} />
          <PostCardSaveButton writingId={post.id} initialBookmarked={!!post.isBookmarked} />
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 opacity-70" />
            {post.readingTime} min
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 opacity-70" />
            {post.views}
          </span>
        </div>
      </div>
    </article>
  );
}

import { Heart, Bookmark } from "lucide-react";
import { useUser, useHexclaveApp } from "@hexclave/next";
import { toast } from "sonner";
import * as React from "react";

function PostCardReactionButton({ writingId, initialReactions, initialUserReaction }: { writingId: string, initialReactions: Record<string, number>, initialUserReaction?: string | null }) {
  const hexclaveUser = useUser();
  const hexclaveApp = useHexclaveApp();
  const [reactions, setReactions] = React.useState(initialReactions);
  const [userReaction, setUserReaction] = React.useState<string | null>(initialUserReaction || null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleReact = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hexclaveUser) {
      toast("Please sign in to react to writings", {
        action: { label: "Sign In", onClick: () => hexclaveApp.redirectToSignIn() },
      });
      return;
    }

    if (isSubmitting) return;
    const type = "felt_this";
    const previousReactions = { ...reactions };
    const previousUserReaction = userReaction;
    const next = { ...reactions };

    if (previousUserReaction) {
      next[previousUserReaction] = Math.max(0, (next[previousUserReaction] || 1) - 1);
    }

    if (previousUserReaction === type) {
      setUserReaction(null);
    } else {
      setUserReaction(type);
      next[type] = (next[type] || 0) + 1;
    }
    setReactions(next);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/v1/writings/${writingId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setReactions(previousReactions);
      setUserReaction(previousUserReaction);
      toast.error("Failed to update reaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFelt = userReaction === "felt_this";
  const total = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <button
      onClick={handleReact}
      disabled={isSubmitting}
      aria-label={hasFelt ? "Remove reaction" : "React to this writing"}
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground ${hasFelt ? "text-primary" : ""}`}
    >
      <Heart className={`h-3.5 w-3.5 ${hasFelt ? "fill-current" : ""}`} />
      <span>{total > 0 ? total : "React"}</span>
    </button>
  );
}

function PostCardSaveButton({ writingId, initialBookmarked = false }: { writingId: string, initialBookmarked?: boolean }) {
  const hexclaveUser = useUser();
  const hexclaveApp = useHexclaveApp();
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hexclaveUser) {
      toast("Please sign in to save writings", {
        action: { label: "Sign In", onClick: () => hexclaveApp.redirectToSignIn() },
      });
      return;
    }

    if (isSubmitting) return;
    const previous = bookmarked;
    setBookmarked(!previous);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/v1/writings/${writingId}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName: "All" }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBookmarked(previous);
      toast.error("Failed to update save status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleBookmark}
      disabled={isSubmitting}
      aria-label={bookmarked ? "Remove bookmark" : "Save writing"}
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground ${bookmarked ? "text-primary" : ""}`}
    >
      <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
      <span>{bookmarked ? "Saved" : "Save"}</span>
    </button>
  );
}
