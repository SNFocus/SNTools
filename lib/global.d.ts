type PickRequired<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

type Option = PickRequired<Question, 'name'> & { extra: { argument?: string; short?: string; long?: string } };
declare interface CmdConfig {
  command: string;
  alias: string;
  description: string;
  options: Option[];
}
