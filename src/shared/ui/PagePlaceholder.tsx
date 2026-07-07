type PagePlaceholderProps = {
  title: string;
};

export const PagePlaceholder = ({ title }: PagePlaceholderProps) => (
  <main>
    <h1>{title}</h1>
  </main>
);
