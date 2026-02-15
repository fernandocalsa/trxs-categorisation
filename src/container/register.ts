import axios from "axios";
import type { DependencyContainer } from "tsyringe";

export function registerDependencies(container: DependencyContainer): void {
  container.registerInstance(
    "TripleAxiosClient",
    axios.create({
      baseURL: process.env.TRIPLE_API_ENDPOINT,
      headers: {
        Authorization: `Token ${process.env.TRIPLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }),
  );
}
