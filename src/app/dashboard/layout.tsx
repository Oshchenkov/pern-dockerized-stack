import React, { ReactPromise } from "react";

export default function DashboardLayout({
  children,
  users,
  revenue,
  notifications,
  login,
}: Readonly<{
  children: React.ReactNode;
  users: React.ReactNode;
  revenue: React.ReactNode;
  notifications: React.ReactNode;
  login: React.ReactNode;
}>) {
  const isLoggedIn = true;
  if (!isLoggedIn) {
    return login;
  }
  return (
    <>
      <div>{children}</div>
      <div className="flex">
        <div className="flex flex-col ">
          {users}
          {revenue}
        </div>
        <div className="flex flex-1">{notifications}</div>
      </div>
    </>
  );
}
