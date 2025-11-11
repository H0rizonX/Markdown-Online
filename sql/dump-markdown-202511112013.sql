-- MySQL dump 10.13  Distrib 8.0.33, for Win64 (x86_64)
--
-- Host: localhost    Database: markdown
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `articles`
--

DROP TABLE IF EXISTS `articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `authorId` int NOT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `visibility` enum('team','personal') NOT NULL DEFAULT 'personal',
  `structure` json DEFAULT NULL,
  `teamId` int DEFAULT NULL,
  `tags` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_65d9ccc1b02f4d904e90bd76a34` (`authorId`),
  KEY `FK_729ed807ff9e2b237b1079f56f4` (`teamId`),
  CONSTRAINT `FK_65d9ccc1b02f4d904e90bd76a34` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_729ed807ff9e2b237b1079f56f4` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
/*!40000 ALTER TABLE `articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_articles`
--

DROP TABLE IF EXISTS `team_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_articles` (
  `teamId` int NOT NULL,
  `articlesId` int NOT NULL,
  `addedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`teamId`,`articlesId`),
  KEY `fk_team_articles_articles` (`articlesId`),
  CONSTRAINT `fk_team_articles_articles` FOREIGN KEY (`articlesId`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_articles_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_articles`
--

LOCK TABLES `team_articles` WRITE;
/*!40000 ALTER TABLE `team_articles` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_user`
--

DROP TABLE IF EXISTS `team_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_user` (
  `teamId` int NOT NULL,
  `userId` int NOT NULL,
  PRIMARY KEY (`teamId`,`userId`),
  KEY `IDX_e75e96ec15d1f9b5376dfe8e85` (`teamId`),
  KEY `IDX_2d6eb28b20fa5755ef325d4f7d` (`userId`),
  CONSTRAINT `FK_2d6eb28b20fa5755ef325d4f7d5` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_e75e96ec15d1f9b5376dfe8e853` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_user`
--

LOCK TABLES `team_user` WRITE;
/*!40000 ALTER TABLE `team_user` DISABLE KEYS */;
INSERT INTO `team_user` VALUES (15306553,6);
/*!40000 ALTER TABLE `team_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `ownerId` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `description` text,
  `tags` text,
  PRIMARY KEY (`id`),
  KEY `FK_b5ebe13256317503931ecabb556` (`ownerId`),
  CONSTRAINT `FK_b5ebe13256317503931ecabb556` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=95062792 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (15306553,'测试团队改名',6,'2025-11-11 16:45:15.321770','2025-11-11 20:08:28.000000','用来测试团队改名','测试');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `avatar` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1496404674 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (6,'user168','2898291273@qq.com','https://api.dicebear.com/7.x/miniavs/svg?seed=1','$2b$10$E9et/enkwHJYB3ogLUA86e3rUiP/d9zT59FHSVfxySwH1VFB4JvoG'),(123456,'宇宙无敌霸王龙','1572121126@qq.com','https://api.dicebear.com/7.x/miniavs/svg?seed=1','$2b$10$YLycrbSyVmQaZmT7gc4RVeFMwxtVC030t9IhaEWYAcVW7K7x7HXfC'),(71225489,'user400','431728568@qq.com','https://api.dicebear.com/7.x/miniavs/svg?seed=1','$2b$10$v8P91J6EOWTgE1nBPVyHGO.MEMxcBQTBDZnbXz2miSLJ9IkYUG3AG');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'markdown'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 20:13:59
