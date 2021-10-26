let swiper = new Swiper(".mySwiper", {
    slidesPerView: "auto",
    spaceBetween: 30,
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
});



(function () {

    let hamburger = {
        navToggle: document.querySelector('.nav-toggle'),
        nav: document.querySelector('nav'),

        doToggle: function (e) {
            e.preventDefault();
            this.navToggle.classList.toggle('expanded');
            this.nav.classList.toggle('expanded');
        }
    };

    hamburger.navToggle.addEventListener('click', function (e) { hamburger.doToggle(e); });
    // hamburger.nav.addEventListener('click', function (e) { hamburger.doToggle(e); });

}());