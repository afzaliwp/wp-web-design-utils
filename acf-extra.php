public static function get_field( $selector, $post_id = false, $format_value = true ) {
		if ( function_exists( 'get_field' ) ) {
			return get_field( $selector, $post_id, $format_value );
		}

		return false;
	}

/**
	 * @param $selector
	 * @param string $meta_type : can be term and post (gets data from termmeta or postmeta tables).
	 * @param $post_id : the post id or the term object.
	 * @param $subfield_selectors : an array of the subfields selectors to retrieve.
	 * @return array
	 */
	public static function get_repeater_field( $selector, $post_id, $subfield_selectors, $meta_type = 'term' ) {
		$count = self::get_field( $selector, $post_id );
		$data = [];
		if ( !$count ) {
			return [];
		}

		for ( $i = 0; $i < $count; $i++ ) {
			foreach ( $subfield_selectors as $subfield_selector ) {
				if ( 'term' === $meta_type ) {
					if ( is_object( $post_id ) ) {
						$post_id = $post_id->term_id;
					}
					$sub_field_value = get_term_meta( $post_id, $selector . '_' . $i . '_' . $subfield_selector, true );
				} else {
					$sub_field_value = get_post_meta( $post_id, $selector . '_' . $i . '_' . $subfield_selector, true  );
				}

				$data[$i][ $subfield_selector ] = $sub_field_value;
			}
		}

        return $data;
	}
