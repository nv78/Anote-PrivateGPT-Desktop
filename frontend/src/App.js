import Dashboard from "./Dashboard";
// import MetricsRoutes from "./metrics_components/MetricsRoutes";
// import ReactGA4 from "react-ga4";
import { HashRouter as Router } from "react-router-dom";
// ReactGA4.initialize("G-PNX85JC0CV");

function App() {
    return (
        <Router>
            <Dashboard />
        </Router>
    );
}

export default App;
