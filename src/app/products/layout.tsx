import Navigation from "@/components/Navigation";

const links = [
  {
    href: "/products",
    label: "Products",
  },
  {
    href: "/products/1",
    label: "Product 1",
  },
  {
    href: "/products/1/reviews/2",
    label: "Pr Rew 1 - 2",
  },
];

export default function FLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col">
        <Navigation links={links} />
      </div>
      {children}
    </div>
  );
}
