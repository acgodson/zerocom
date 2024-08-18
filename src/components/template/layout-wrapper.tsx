import AuroraBackground from "../atoms/aurora-background";

import Header from "../organisms/header";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex w-screen">
      <AuroraBackground className="flex flex-col gap-2 w-full">
        <Header />
        {children}
      </AuroraBackground>
    </main>
  );
};

export default LayoutWrapper;
