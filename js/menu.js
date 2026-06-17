

document.addEventListener('DOMContentLoaded', () => {

	const menuBody = document.querySelector('.menu__body');
	const header = document.querySelector('.header');
	const menuIcon = document.querySelector('.menu-icon');
	const body = document.querySelector('body');
	const html = document.querySelector('html');
	
	
	menuIcon.addEventListener('click', () => {
		header.classList.toggle('active');
		menuBody.classList.toggle('_active');
		menuIcon.classList.toggle('_active');
		body.classList.toggle('_lock');
		html.classList.toggle('_lock');
	})

	document.querySelectorAll('.menu-icon').forEach(menuIcon => {
		menuIcon.innerHTML = "<span></span>".repeat(3);
	});
	



	


})







