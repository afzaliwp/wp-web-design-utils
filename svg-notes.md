//sample of working clip path svg
```
	<svg>
		<defs>
			<clipPath id="folder-clip-path" clipPathUnits="objectBoundingBox">
				<!-- Convert coordinates to 0-1 range -->
				<path d="M0.544 0.069 H0.031 C0.014 0.069,0 0.085,0 0.105 V0.964 C0 0.984,0.014 1,0.031 1 H0.969 C0.986 1,1 0.984,1 0.964 V0.036 C1 0.016,0.986 0,0.969 0 H0.63 C0.628 0,0.626 0.0002,0.623 0.0005 C0.61 0.002,0.589 0.007,0.573 0.015 C0.548 0.026,0.529 0.041,0.51 0.06 C0.499 0.07,0.484 0.069,0.475 0.069 Z"/>
			</clipPath>
		</defs>
	</svg>
```
- the coordinates are converted to 0 - 1 range
- using clipPathUnits="objectBoundingBox"
- using <defs>
- using <clipPath id="a-sample-id" clipPathUnits="objectBoundingBox">
