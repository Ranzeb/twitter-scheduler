import { CompositeDecorator } from "draft-js";
import { createHighlightDecorator } from "./createHighlightDecorator";
import { createOverLimitDecorator } from "./createOverLimitDecorator";

const detectHashtag = /(?:\s|^)(#[\w]+\b)/gi;
const detectURL = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

export const composeDecorators = (maxChars) =>
  new CompositeDecorator([
    createOverLimitDecorator(maxChars),
    createHighlightDecorator(detectHashtag),
    createHighlightDecorator(detectURL)
  ]);
