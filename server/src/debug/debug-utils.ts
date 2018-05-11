export class DebugUtils {
  static createTimestamp(): number {
    return new Date().getTime();
  }

  static time(timestamp: number): void {
    const ts2 = new Date().getTime();
    console.log(`${ts2 - timestamp} ms`);
  }
}
