const colors = { warning: "#ffad1f", error: "#e0245e", success: "#1da1f2" };
export function getColors(numOfChars, max, warning) {
  switch (true) {
    case numOfChars >= 0 && numOfChars < max - warning: {
      return colors.success;
    }
    case numOfChars >= max - warning && numOfChars <= max: {
      return colors.warning;
    }
    default:
      return colors.error;
  }
}
