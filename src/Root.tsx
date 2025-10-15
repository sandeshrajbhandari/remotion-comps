import './index.css';
import { Composition, Still } from "remotion";
import { compositionRegistry } from "./compositionRegistry";
// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {compositionRegistry.map((entry) =>
        entry.kind === "still" ? (
          <Still
            key={entry.id}
            id={entry.id}
            component={entry.component as any}
            width={entry.width}
            height={entry.height}
            schema={entry.schema as any}
            defaultProps={entry.defaultProps}
          />
        ) : null
      )}

      {/* Register additional compositions including MasterSequence */}
      <DefaultScreen />
    </>
  );
};

export const DefaultScreen: React.FC = () => {
  return (
    <>
      {compositionRegistry
        .filter((entry) => entry.kind === "composition")
        .map((entry) => (
          <Composition
            key={entry.id}
            id={entry.id}
            component={entry.component as any}
            durationInFrames={entry.durationInFrames as number}
            fps={entry.fps as number}
            width={entry.width}
            height={entry.height}
            schema={entry.schema as any}
            defaultProps={entry.defaultProps}
            calculateMetadata={entry.calculateMetadata as any}
          />
        ))}
    </>
  );
};