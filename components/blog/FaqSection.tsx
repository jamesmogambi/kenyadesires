import { cn } from "@/lib/utils";

interface FaqItem {
  _key: string;
  question: string;
  answer: string;
}

interface FaqSectionProps {
  faq: FaqItem[];
  className?: string;
}

const FaqSection = ({ faq, className }: FaqSectionProps) => {
  if (!faq || faq.length === 0) return null;

  return (
    <section className={cn("my-12", className)}>
      <h2 className="text-2xl font-bold text-primary mb-6">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {faq.map((item) => (
          <div
            key={item._key}
            className="border border-gray-700 rounded-lg p-6 bg-black/30"
          >
            <h3
              id={`faq-${item._key}`}
              className="text-lg font-semibold text-white mb-3"
            >
              {item.question}
            </h3>
            <p className="text-white/80 text-base leading-relaxed">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;
