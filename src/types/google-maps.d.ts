declare global {
  namespace google {
    namespace maps {
      namespace places {
        class Autocomplete {
          constructor(
            input: HTMLInputElement,
            opts?: {
              types?: string[];
              componentRestrictions?: { country: string };
              fields?: string[];
            }
          );
          getPlace(): { address_components?: unknown[] };
          addListener(event: string, handler: () => void): unknown;
        }
      }
      namespace event {
        function removeListener(listener: unknown): void;
      }
    }
  }
}

export {};
