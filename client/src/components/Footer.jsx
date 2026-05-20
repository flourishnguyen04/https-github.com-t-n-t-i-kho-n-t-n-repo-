import { BookOpen } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-paperSoft">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
      <div className="flex items-center gap-2 font-display font-bold text-primary">
        <BookOpen aria-hidden="true" size={18} />
        WriteWise
      </div>
      <p>Write it right, unlock your insight.</p>
      <p>Built for English grammar-focused writing practice.</p>
    </div>
  </footer>
);

export default Footer;
