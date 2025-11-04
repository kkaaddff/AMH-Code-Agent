export class Lifecycle {}

export function Init(): ClassDecorator {
  return function (target: any) {
    target;
  };
}

export function filterTruthy<T>(obj: T): Partial<T> {
  const filteredEntries = Object.entries(obj).filter(([, value]) => value);
  return Object.fromEntries(filteredEntries) as Partial<T>;
}

export const safeJsonParse = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.log("safeJsonParse error", str);
    return null;
  }
};

export function deepMapValues(
  obj: any,
  fn: (value: any, key?: string) => any
): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepMapValues(item, fn));
  }

  const newObj: any = {};
  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      if (typeof obj[prop] === "object" && obj[prop] !== null) {
        newObj[prop] = deepMapValues(obj[prop], fn);
      } else {
        newObj[prop] = fn(obj[prop], prop);
      }
    }
  }

  return newObj;
}
