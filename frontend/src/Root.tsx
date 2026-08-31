import { useNavigation } from "@/contexts/NavigationContext";

import App from "./App";
import { About } from "./components/About";
import { Help } from "./components/Help";
import { Welcome } from "./components/Welcome";

export function Root() {
  const { activePage } = useNavigation();

  if (activePage === "welcome") {
    return <Welcome />;
  }

  return (
    <>
      <div hidden={activePage !== "explorer"}>
        <App />
      </div>

      {activePage === "help" && <Help />}

      {activePage === "about" && <About />}
    </>
  );
}
