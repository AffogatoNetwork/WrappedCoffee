import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { theme, ThemeProvider } from "rimble-ui";

const affogatoTheme = {
  ...theme,
  colors: {
    primary: "#332211",
    black: "#3f3d4b",
    white: "#fff",
    blue: "#007ce0",
    navy: "#004175",
    secondary: "#cc7722"
  }
};

ReactDOM.render(
  <ThemeProvider theme={affogatoTheme}>
    <App />
  </ThemeProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
