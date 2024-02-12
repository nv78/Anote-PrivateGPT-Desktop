import Dashboard from "./Dashboard";
import Test from "./financeGPT/components/Test.js"
// import MetricsRoutes from "./metrics_components/MetricsRoutes";
// import ReactGA4 from "react-ga4";
import { HashRouter as Router } from "react-router-dom";
// ReactGA4.initialize("G-PNX85JC0CV");

import HomeChatbot from "./financeGPT/components/Home.js"
import Installation from "./financeGPT/components/Installation.js"


function App() {
    return (
        <Router>
             <Installation />
            {/* <HomeChatbot /> */}
        </Router>
    );
}

export default App;
