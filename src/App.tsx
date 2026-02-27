import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TradingDashboard from "./pages/TradingDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TradingDashboard />
    </QueryClientProvider>
  );
}

export default App;
