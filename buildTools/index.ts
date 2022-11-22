import {Logger, LoggerColour, PrefixedLogger} from "./logger";

export interface PipelineStep {
  onRun: (ctx: {
    pipeline: Pipeline;
    done: () => void;
    failed: (err: any) => void;
  }) => void;
}

type PipelineStepGroup = PipelineStep[];

export abstract class Pipeline {
  running = false;
  watchMode = false;

  logger: Logger;

  constructor(
    public name: string,
    colour?: LoggerColour,
    loggerPrefix?: string
  ) {
    this.logger = new PrefixedLogger(loggerPrefix ?? name, colour);
  }

  abstract getSteps(): (PipelineStep | PipelineStepGroup)[];

  abstract init(): Promise<void>;

  private _firstRun = true;

  private _awaitingFirstRun: (() => void)[] = [];

  private _steps?: PipelineStepGroup[];

  private _runningStepIndex: number | null = null;
  private _runningStepsWaiting: number = 0;

  private _pendingStepIndex: number | null = null;

  async start(watch: boolean) {
    if (this.running) {
      throw new Error("Cannot start already running pipeline");
    }

    this.watchMode = watch;
    this.running = true;

    await this.init();

    this._steps = this.getSteps().map((step) =>
      Array.isArray(step) ? step : [step]
    );

    this._pendingStepIndex = 0;
    this._runNextStep();
  }

  private _runNextStep() {
    const stepIndex = this._pendingStepIndex ?? -1;
    const steps = this._steps?.[stepIndex];
    if (!steps) {
      return;
    }

    this._runningStepIndex = stepIndex;
    this._runningStepsWaiting = steps.length;
    this._pendingStepIndex = stepIndex + 1;

    for (const step of steps) {
      step.onRun({
        pipeline: this,
        done: () => {
          this._stepDone(stepIndex, false);
        },
        failed: (err) => {
          if (!this.watchMode || this._firstRun) {
            throw new Error(err);
          } else {
            this.logger.error(err);

            this._pendingStepIndex = null;
            this._stepDone(stepIndex, true);
          }
        },
      });
    }
  }

  private _stepDone(stepIndex: number, failed: boolean) {
    if (this._runningStepIndex !== null) {
      // step in progress
      if (stepIndex === this._runningStepIndex) {
        // is current step
        this._runningStepsWaiting -= 1;
        if (this._runningStepsWaiting === 0) {
          if (!failed && this._runningStepIndex === this._steps!.length - 1) {
            this._firstRun = false;
            for (const resolve of this._awaitingFirstRun) {
              resolve();
            }
          }
          this._runningStepIndex = null;
          this._runNextStep();
        }
      } else {
        if (!failed && stepIndex < this._runningStepIndex) {
          // reset pipeline to earlier step
          this._pendingStepIndex = stepIndex + 1;
        }
      }
    } else if (!failed) {
      // pipeline idle
      this._pendingStepIndex = stepIndex + 1;
      this._runNextStep();
    }
  }

  awaitFirstRun() {
    if (!this._firstRun) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this._awaitingFirstRun.push(resolve);
    });
  }
}

interface PipelineRunnerOpts {
  watchMode: boolean;
  skip?: Set<string>;
  only?: Set<string>;
  pipelines: (
    | {
        pipeline: Pipeline;
        waitOn?: Set<string>;
      }
    | Pipeline
  )[];
}

export class PipelineRunner {
  private _pipelines = new Map<
    string,
    {pipeline: Pipeline; waitOn?: Set<string>}[]
  >();
  watchMode: boolean;
  skip?: Set<string>;
  only?: Set<string>;

  constructor({watchMode, skip, only, pipelines}: PipelineRunnerOpts) {
    this.watchMode = watchMode;

    const normalisedPipelines: {
      pipeline: Pipeline;
      waitOn?: Set<string>;
    }[] = [];

    for (const pipeline of pipelines) {
      const pipelineOpts =
        pipeline instanceof Pipeline
          ? {
              pipeline,
              waitOn: (undefined as unknown) as Set<string>,
            }
          : pipeline;
      normalisedPipelines.push(pipelineOpts);

      const pipelineName = pipelineOpts.pipeline.name;
      if (!this._pipelines.has(pipelineName)) {
        this._pipelines.set(pipelineName, []);
      }
      this._pipelines.get(pipelineName)!.push(pipelineOpts);
      if (watchMode && this._pipelines.get(pipelineName)!.length > 1) {
        throw new Error(
          `Cannot run multiple pipelines with the same name (${pipelineName}) in watchMode`
        );
      }
    }

    for (const {waitOn, pipeline} of normalisedPipelines) {
      if (waitOn) {
        if (waitOn.has(pipeline.name)) {
          throw new Error("Cannot wait on own pipeline");
        }
        for (const waitName of waitOn.values()) {
          if (!this._pipelines.has(waitName)) {
            throw new Error(
              `Cannot wait on non-existant pipeline: ${waitName}`
            );
          }
        }
      }
    }

    if (skip && only) {
      throw new Error(`Cannot run with both 'skip' and 'only' options`);
    }
    if (
      skip &&
      [...skip.values()].some((name) => !this._pipelines.has(name))
    ) {
      throw new Error(
        `Invalid 'skip' option, pipeline '${[...skip.values()].find(
          (name) => !this._pipelines.has(name)
        )}' does not exist (Valid values are: ${[
          ...this._pipelines.keys(),
        ].join(", ")})`
      );
    }
    if (
      only &&
      [...only.values()].some((name) => !this._pipelines.has(name))
    ) {
      throw new Error(
        `Invalid 'only' option, pipeline '${[...only.values()].find(
          (name) => !this._pipelines.has(name)
        )}' does not exist (Valid values are: ${[
          ...this._pipelines.keys(),
        ].join(", ")})`
      );
    }
    this.skip = skip;
    this.only = only;
  }

  async runPipelineGroup(name: string, activePipelines: Set<string>) {
    const pipelines = this._pipelines.get(name)!;

    for (const pipeline of pipelines) {
      if (pipeline.waitOn) {
        const waitOn = [...pipeline.waitOn].filter((name) =>
          activePipelines.has(name)
        );

        pipeline.pipeline.logger.log(
          `Waiting on ${waitOn.map((name) => `'${name}'`).join(", ")}`
        );

        await Promise.all(
          waitOn.flatMap((name) =>
            this._pipelines
              .get(name)!
              .map(({pipeline}) => pipeline.awaitFirstRun())
          )
        );
      }

      pipeline.pipeline.start(this.watchMode);
      await pipeline.pipeline.awaitFirstRun();
    }
  }

  start() {
    const activePipelines = this.only
      ? this.only
      : this.skip
      ? new Set(
          [...this._pipelines.keys()].filter((name) => !this.skip!.has(name))
        )
      : new Set(this._pipelines.keys());

    for (const pipelineName of activePipelines) {
      this.runPipelineGroup(pipelineName, activePipelines);
    }
  }
}
