/**
 * Stripe Checkout Session line_items: weight subtotal + per-type bulky lines + optional tax.
 */

import {
  getAggregatedBulkyLineItems,
  mergeBulkyItemsAcrossLoads,
  type BulkyItems,
} from "./bulky-items";
import type { LoadWithWeight } from "./order-total";

export type StripeCheckoutLineItem = {
  price_data: {
    currency: "usd";
    product_data: {
      name: string;
      description?: string;
    };
    unit_amount: number;
  };
  quantity: number;
};

type OrderDates = {
  orderNumber: string;
  pickupDate: Date;
  deliveryDate: Date;
};

function formatOrderContext(o: OrderDates): string {
  return `Order ${o.orderNumber} · Pickup ${new Date(o.pickupDate).toLocaleDateString()}, delivery ${new Date(o.deliveryDate).toLocaleDateString()}`;
}

/**
 * Build Stripe line items for wash (by weight) and aggregated bulky SKUs.
 * Tax line is not included here — add separately when creating the session.
 */
export function buildWashAndBulkyStripeLineItems(
  order: OrderDates,
  loads: Array<LoadWithWeight & { bulkyItems?: BulkyItems | unknown | null }>,
  pricePerPoundCents: number
): StripeCheckoutLineItem[] {
  const totalLbs = loads.reduce(
    (sum, l) => sum + (Number(l.weightLbs) || 0),
    0
  );
  const weightSubtotalCents = Math.round(totalLbs * pricePerPoundCents);
  const mergedBulky = mergeBulkyItemsAcrossLoads(
    loads.map((l) => ({ bulkyItems: l.bulkyItems as BulkyItems | null }))
  );
  const bulkyLines = getAggregatedBulkyLineItems(
    mergedBulky,
    pricePerPoundCents
  );

  const items: StripeCheckoutLineItem[] = [];
  const ctx = formatOrderContext(order);

  if (weightSubtotalCents > 0) {
    const perLb = (pricePerPoundCents / 100).toFixed(2);
    items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Wash and fold (by weight)",
          description: `${totalLbs.toFixed(1)} lb × $${perLb}/lb · ${ctx}`,
        },
        unit_amount: weightSubtotalCents,
      },
      quantity: 1,
    });
  }

  for (const line of bulkyLines) {
    items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: line.name,
          description: `Bulky item · ${ctx}`,
        },
        unit_amount: line.unitCents,
      },
      quantity: line.qty,
    });
  }

  return items;
}
