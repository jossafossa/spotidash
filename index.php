<?php include "header.php"; ?>

<div class="background"></div>
<div class="dashboard">
	<div class="top-menu"><!-- <div class="round-button toggle-visualizer"></div> --></div>
	<div class="container">
		<img src="" alt="" class="image">
		<h1 class="title"></h1>
		<h2 class="artist"></h2>
		<h2 class="album"></h2>
	</div>
	<div class="player">
		<div class="player_buttons">
			<div class="round-button shuffle fas fa-random"></div>
			<div class="round-button previous fas fa-chevron-left"></div>
			<div class="round-button play fas fa-play"></div>
			<div class="round-button next fas fa-chevron-right"></div>
			<div class="round-button repeat fas fa-redo-alt"></div>
		</div>
		<div class="player_time">
			<div class="time">				
				<div class="progress"></div>
				<div class="duration"></div>
			</div>
			<div class="bar"><span></span></div>
		</div>
	</div>
</div>

<?php include "footer.php"; ?>