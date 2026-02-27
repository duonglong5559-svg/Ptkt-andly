import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import TradingDashboard from "./pages/TradingDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TradingDashboard />
      <Toaster theme="dark" richColors />
    </QueryClientProvider>
  );
}

export default App;
