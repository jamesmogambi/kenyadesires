import { cn } from "@/lib/utils";
import React from "react";

interface FaqCardProps {
  question: string;
  answer: React.ReactNode;
  className?: string;
}

const LINK_REGEX = /(https?:\/\/[^\s]+)/g;
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

const renderInlineText = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  const combinedRegex = new RegExp(
    `(${LINK_REGEX.source}|${EMAIL_REGEX.source})`,
    "g",
  );

  let match: RegExpExecArray | null;
  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("http")) {
      parts.push(
        <a
          key={`link-${key++}`}
          href={token}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline"
        >
          {token}
        </a>,
      );
    } else {
      parts.push(
        <a
          key={`email-${key++}`}
          href={`mailto:${token}`}
          className="text-primary underline"
        >
          {token}
        </a>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const parseAnswer = (answer: React.ReactNode): React.ReactNode => {
  if (typeof answer !== "string") {
    return answer;
  }

  const lines = answer.split("\n");
  const result: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(
        <ul key={`list-${key++}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineText(item)}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
      listItems.push(trimmed.slice(1).trim());
    } else if (trimmed.length === 0) {
      flushList();
    } else {
      flushList();
      result.push(
        <li key={`p-${key++}`} className="mb-2 ">
          {renderInlineText(trimmed)}
        </li>,
      );
    }
  });

  flushList();

  return result;
};

const FaqCard = ({ question, answer, className }: FaqCardProps) => {
  return (
    <div className={cn("bg-white rounded-lg mb-10", className)}>
      <h3 className="text-xl font-semibold text-primary mb-4">{question}</h3>
      <div className="text-gray-700 pl-4  font-medium">
        {parseAnswer(answer)}
      </div>
    </div>
  );
};

export default FaqCard;
