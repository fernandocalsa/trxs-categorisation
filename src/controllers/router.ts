import { injectable } from "tsyringe";
import { CategorisationController } from "./categorisation.controller";
import { HelpController } from "./help.controller";

/**
 * Routes raw CLI arguments to the appropriate controller.
 */
@injectable()
export class Router {
  constructor(
    private readonly helpController: HelpController,
    private readonly categorisationController: CategorisationController,
  ) {}

  async route(args: string[]): Promise<void> {
    const isHelp =
      args.length === 0 || args[0] === "--help" || args[0] === "-h";

    if (isHelp) {
      this.helpController.run();
      return;
    }

    await this.categorisationController.run(args);
  }
}
