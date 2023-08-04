import { McmsDiContainer } from "./mcms-component.decorator";

export interface IMcrmModelConfig {
  name: string
}

export const McrMModel = (id: string) => {
  McmsDiContainer.add({
    type: 'model',
    id,
  });
}
