## WooCommerce Melipayamak sms patterns:
### Admin:
```
@309405@{order_id};{price}##shared
```
```
سلام مدیر
سفارش {order_id} ثبت شده است و هم اکنون در وضعیت در حال انجام می‌باشد.
مبلغ سفارش : {price}
```
### Customer:
```
@309409@{b_first_name};{order_id};{price};{transaction_id}##shared 
```
```
سلام {b_first_name}
سفارش {order_id} دریافت شد و هم اکنون در وضعیت در انتظار بررسی می‌باشد.
مبلغ سفارش : {price}
شماره تراکنش : {transaction_id}
آدرس سایت در اینجا
```

## Tehran Postal Code range for woocommerce shipping
```
1111111111...1199999999
1313111111...1399999999
1414111111...1499999999
1515111111...1599999999
1616111111...1699999999
1717111111...1799999999
1818111111...1899999999
1919111111...1999999999
```

------------------------------------------------------------------------
## Check to see if cart only contains the downloadble products and virtual

```
private function cart_contains_only_virtual_downloadable() {
		if ( is_null( WC()->cart ) || WC()->cart->is_empty() ) {
			return false;
		}

		foreach ( WC()->cart->get_cart() as $cart_item ) {
			$product = $cart_item[ 'data' ];
			if ( ! $product->is_virtual() && ! $product->is_downloadable() ) {
				return false;
			}
		}

		return true;
	}

	public function handle_virtual_order( $order_id, $posted_data, $order ) {
		// Automatically complete virtual orders
		if ( $order->has_downloadable_item() ) {
			$order->update_status( 'completed' );
		}
	}
```
------------------------------------------------------------------------
