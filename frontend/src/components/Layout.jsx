import NavBar from "./NavBar";
import Sidebar from "./Sidebar";
import Breadcrumbs from "./Breadcrumbs";

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <NavBar />
        <Breadcrumbs />
        <main className="content container">
          {children}
        </main>
      </div>
    </div>
  );
}
