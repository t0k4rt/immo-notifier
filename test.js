var jade = require('jade');




var testInfos = [ { state: 'fulfilled',
  value:
  { url: 'http://www.seloger.com/annonces/locations/appartement/paris-20eme-75/plaine/92200301.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea&bd=Li_LienAnn_1',
    prix: '853,10 € CC',
    tel: ' Téléphone 01 53 98 58 58 ',
    surface: 'Surface de 36 m²',
    honoraires: 100 } },
  { state: 'fulfilled',
    value:
    { url: 'http://www.seloger.com/annonces/locations/appartement/paris-19eme-75/92199891.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea&bd=Li_LienAnn_1',
      prix: '878 € +CH',
      tel: ' Téléphone 06 72 73 97 99 ',
      surface: 'Surface de 35 m²',
      honoraires: 100 } },
  { state: 'fulfilled',
    value:
    { url: 'http://www.seloger.com/annonces/locations/appartement/paris-10eme-75/porte-saint-denis-paradis/92035855.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea&bd=Li_LienAnn_1',
      prix: '900 € +CH',
      tel: ' Téléphone 06 79 53 22 27 ',
      surface: 'Surface de 37 m²',
      honoraires: 100 } } ];

var mailTemplate = jade.compileFile('./views/mail/mail.jade', {pretty: true});
console.log(mailTemplate({result: testInfos}));
