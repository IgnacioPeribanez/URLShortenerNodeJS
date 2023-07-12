drop database if exists urlsortered;
create database if not exists urlsortered;
use urlsortered;

CREATE TABLE `url` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `id_Usuario` varchar(50) NOT NULL,
  `url_Original` varchar(500) NOT NULL,
  `url_Nueva` varchar(500) NOT NULL,
  `interacciones` int unsigned NOT NULL,
  `creacion` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

