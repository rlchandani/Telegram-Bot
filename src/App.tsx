import "./App.css";
import "semantic-ui-css/semantic.min.css";
import { Route, BrowserRouter as Router, Switch, Redirect, RouteProps } from "react-router-dom";
import Home from "./pages/Home/index";
import { getTokenAction, onMessageListener } from "./helper/initFirebase";
import { useEffect, useState } from "react";
import { SemanticToastContainer, toast } from "react-semantic-toasts";
import "react-semantic-toasts/styles/react-semantic-alert.css";

interface PrivateRouteProps extends RouteProps {
  component: any;
  authenticated: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PrivateRoute = (props: PrivateRouteProps) => {
  const { component: Component, authenticated, ...rest } = props;
  return (
    <Route
      {...rest}
      render={(props) =>
        authenticated === true ? <Component {...props} /> : <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
      }
    />
  );
};

const PublicRoute = (props: PrivateRouteProps) => {
  const { component: Component, authenticated, ...rest } = props;
  return <Route {...rest} render={(props) => (authenticated === false ? <Component {...props} /> : <Redirect to="/chat" />)} />;
};

function App() {
  const [show, setShow] = useState(false);
  const [notification, setNotification] = useState({ title: "", body: "" });
  const [isTokenFound, setTokenFound] = useState(false);

  useEffect(() => {
    getTokenAction(isTokenFound, setTokenFound);
    onMessageListener()
      .then((payload: any) => {
        setShow(true);
        setNotification({ title: payload.notification.title, body: payload.notification.body });
        toast(
          {
            type: "success",
            title: payload.notification.title,
            description: payload.notification.body,
            time: 5000,
            animation: "bounce",
            size: "mini",
          },
          () => console.log("Toast Closed"),
          () => console.log("Toast Clicked"),
          () => console.log("Toast Dismissed")
        );
        console.log("Received foreground message ", payload);
      })
      .catch((err) => console.log("failed: ", err));
  }, []);

  return (
    <div>
      <SemanticToastContainer position="top-right" />
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          {/* <PrivateRoute path="/chat" authenticated={this.state.authenticated} component={Chat} />
        <PublicRoute path="/signup" authenticated={this.state.authenticated} component={Signup} />
        <PublicRoute path="/login" authenticated={this.state.authenticated} component={Login} /> */}
        </Switch>
      </Router>
    </div>
  );
}

export default App;
