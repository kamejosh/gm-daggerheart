import ReactDOM from "react-dom/client";
import React from "react";
import { GMDaggerheart } from "./components/gmdaggerheart/GMDaggerheart.tsx";
import "./_css/main.scss";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(GMDaggerheart));
