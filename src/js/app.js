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
        hamburgerNav: document.getElementById('hamburgerNav'),
        outer: document.getElementById('outer'),
        link: document.getElementById('mobile-nav'),


        doToggle: function (e, isOpen) {


            this.navToggle.classList.toggle('expanded', isOpen);
            this.hamburgerNav.classList.toggle('expanded', isOpen);
            this.outer.classList.toggle('shadow', isOpen);
            document.body.classList.toggle('overflow-hidden', isOpen);
        }
    };

    hamburger.navToggle.addEventListener('click', function (e) { hamburger.doToggle(e); e.stopPropagation() });
    hamburger.outer.addEventListener('click', function (e) { hamburger.doToggle(e, false); });
    hamburger.hamburgerNav.addEventListener('click', function (e) { e.stopPropagation(); console.log('123'); });
    hamburger.link.addEventListener('click', function (e) { hamburger.doToggle(e, false); console.log('click link'); });
}());