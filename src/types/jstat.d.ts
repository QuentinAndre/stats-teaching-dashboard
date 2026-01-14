declare module 'jstat' {
  interface Distribution {
    sample(...params: number[]): number;
    pdf(x: number, ...params: number[]): number;
    cdf(x: number, ...params: number[]): number;
  }

  const jStat: {
    normal: Distribution;
    uniform: Distribution;
    gamma: Distribution;
    exponential: Distribution;
    beta: Distribution;
  };

  export default jStat;
}
