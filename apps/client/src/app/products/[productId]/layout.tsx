export default function ProductsIdLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="my-4 text-3xl px-8 text-cyan-900 text-center font-bold ">
        Product Layout:
      </h1>
      {children}
    </div>
  );
}
