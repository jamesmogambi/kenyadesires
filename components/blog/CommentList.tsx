import { BlogComment } from "@/server-actions/blog-comments.action";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Prop {
  comments: BlogComment[];
  className?: string;
}

const CommentList = ({ comments, className }: Prop) => {
  if (!comments || comments.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-white/50 text-lg">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="bg-gray-1 rounded-lg p-4 md:p-6"
        >
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {comment.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mb-2">
                <span className="font-bold text-white text-sm md:text-base">
                  {comment.name}
                </span>
                <span className="text-white/40 text-xs md:text-sm">
                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-white/80 text-sm md:text-base leading-relaxed break-words">
                {comment.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
