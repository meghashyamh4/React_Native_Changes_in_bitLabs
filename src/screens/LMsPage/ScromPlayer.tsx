import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, BackHandler, TouchableOpacity, Text, ScrollView, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import ProgressService from '@services/Progress/ProgressService';
import { useAuth } from '@context/Authcontext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScormService from '../../services/Scorm/ScormService';

const { width } = Dimensions.get('window');

const COURSE_DATA: Record<string, any[]> = {
  "html & css": [
    { topic: "Introduction to Web App", videos: [{ title: "What is a Web Application?", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/introductiontowebapp_topic1/index_lms.html" }] },
    { topic: "HTML for Beginners", videos: [{ title: "Basics of HTML Structure", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/htmlforbegginers_topic2/index_lms.html" }] },
    { topic: "CSS Part 1", videos: [{ title: "Introduction to CSS Styling", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/csspart1_topic3/index_lms.html" }] },
    { topic: "CSS Part 2", videos: [{ title: "Advanced CSS Concepts", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/csspart2_topic4/index_lms.html" }] },
    { topic: "HTML Forms", videos: [{ title: "Creating Forms in HTML", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/HTML%20FORMS_topic5/index_lms.html" }] },
  ],
  "python": [
    { topic: "Introduction to python", videos: [{ title: "What is a python?", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Introduction+to+Python_topic1/index_lms.html" }] },
    { topic: "Python variables and data types", videos: [{ title: "Variables and Data Types", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Variables+and+Data+Types_topic2/index_lms.html" }] },
    { topic: "Python Operators", videos: [{ title: "Operators", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Operators_topic3/index_lms.html" }] },
    { topic: "Python conditional statements", videos: [{ title: "Conditional Statements", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Conditional+Statements_topic4/index_lms.html" }] },
    { topic: "Python Loops", videos: [{ title: "Loops", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Loop+Control+Statements_topic5/index_lms.html" }] },
    { topic: "Python Data Structures Part 1", videos: [{ title: "Data Structures Part 1", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Data+Structures++Part+1_topic6/index_lms.html" }] },
    { topic: "Python Data Structures Part 2", videos: [{ title: "Data Structures Part 2", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Data+Structures++Part+2_topic7/index_lms.html" }] },
    { topic: "Python Data Structures Part 3", videos: [{ title: "Data Structures Part 3", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Data+Structures++Part+3_(Strings)_topic8/index_lms.html" }] },
    { topic: "Python functions", videos: [{ title: "Functions", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Functions_topic9/index_lms.html" }] },
    { topic: "Python modules", videos: [{ title: "Modules", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Modules_topic10/index_lms.html" }] },
    { topic: "Python OOPS", videos: [{ title: "OOPS concepts", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Object+Oriented+Programming_topic11/index_lms.html" }] },
    { topic: "Python Constructors", videos: [{ title: "Constructors", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Constructors_topic12/index_lms.html" }] },
    { topic: "Python Inheritence", videos: [{ title: "Inheritence", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Python+Inheritance_topic13/index_lms.html" }] },
  ],
  "java": [
    { topic: "Problem solving Fundamentals", videos: [{ title: "Problem solving Fundamentals", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/Topic+1+PROBLEM+SOLVING+FUNDAMENTALS+-+Copy/index_lms.html" }] },
    { topic: "Introduction to java", videos: [{ title: "Introduction to java", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/INTRODUCTION+TO+JAVA/index_lms.html" }] },
    { topic: "Data Types", videos: [{ title: "Data Types", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/Topic+3+DATA+TYPES/index_lms.html" }] },
    { topic: "Control Statements", videos: [{ title: "Control Statements", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/CONTROL+STATEMENTS/index_lms.html" }] },
    { topic: "Arrays", videos: [{ title: "Arrays", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/ARRAYS/index_lms.html" }] },
    { topic: "Java Classes and Objects", videos: [{ title: "Java Classes and Objects", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/JAVA+CLASS+AND+OBJECTS/index_lms.html" }] },
    { topic: "Java Classes Members", videos: [{ title: "Java Classes Members", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/JAVA+CLASS+MEMBERS/index_lms.html" }] },
    { topic: "Strings", videos: [{ title: "Strings", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/STRINGS/index_lms.html" }] },
    { topic: "OOPS - part1", videos: [{ title: "OOPS - part1", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/OOPS+-+PART1/index_lms.html" }] },
    { topic: "OOPS - part2", videos: [{ title: "OOPS - part2", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/OOPS+–+PART2/index_lms.html" }] },
    { topic: "Data Structures", videos: [{ title: "Data Structures", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/DATA+STRUCTURES/index_lms.html" }] },
    { topic: "Collections in java - 1", videos: [{ title: "Collections in java - 1", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/COLLECTIONS+IN+JAVA+–+1/index_lms.html" }] },
    { topic: "Collections in java - 2", videos: [{ title: "Collections in java - 2", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javabasics/COLLECTIONS+IN+JAVA+–+1/index_lms.html" }] },
  ],
  'interview preparedness': [
    // ── Group 0: Understanding Yourself (3 subtopics) ──────────────────────
    { topic: "Understanding Yourself – Self Realization", groupName: "Understanding Yourself", groupIndex: 0, videos: [{ title: "Understanding Yourself – Self Realization", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Softskills+Foundation+-+Understanding+Yourself++Self+Realization/index_lms.html" }] },
    { topic: "Confidence Building & Self-Motivation", groupName: "Understanding Yourself", groupIndex: 0, videos: [{ title: "Confidence Building & Self-Motivation", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Softskills+Foundation+-+Confidence+building+and+self-motivation/index_lms.html" }] },
    { topic: "Overcoming Shyness, Fear & Anxiety", groupName: "Understanding Yourself", groupIndex: 0, videos: [{ title: "Overcoming Shyness, Fear & Anxiety", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Shyness%2C+Fear%2C+and+Anxiety+-+Ways+of+Control/index_lms.html" }] },
    // ── Group 1: Introduction to Communication (4 subtopics) ───────────────
    { topic: "Components of Communication", groupName: "Introduction to Communication", groupIndex: 1, videos: [{ title: "Components of Communication", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Softskills+Foundation+-+Components+of+Communication/index_lms.html" }] },
    { topic: "Communication Methods", groupName: "Introduction to Communication", groupIndex: 1, videos: [{ title: "Communication Methods", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Softskills+Foundation+-+Communication+Methods/index_lms.html" }] },
    { topic: "Conveying Message Effectively – Part 1", groupName: "Introduction to Communication", groupIndex: 1, videos: [{ title: "Conveying Message Effectively – Part 1", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Conveying+Message+Effectively+-+Part+1/index_lms.html" }] },
    { topic: "Conveying Message Effectively – Part 2", groupName: "Introduction to Communication", groupIndex: 1, videos: [{ title: "Conveying Message Effectively – Part 2", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Softskills+Foundation+-+Conveying+Message+Effectively+-+Part+2/index_lms.html" }] },
    // ── Group 2: Self Introduction (3 subtopics) ──────────────────────────
    { topic: "Creating Self-Introduction", groupName: "Self Introduction", groupIndex: 2, videos: [{ title: "Creating Self-Introduction", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Softskills+Foundation+-+Creating+Self-introduction/index_lms.html" }] },
    { topic: "Tips for Effective Introduction", groupName: "Self Introduction", groupIndex: 2, videos: [{ title: "Tips for Effective Introduction", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Softskills+Foundation+-+Tips+for+Effective+Introduction+in+Different+Scenarios/index_lms.html" }] },
    { topic: "Creating Your First Impression", groupName: "Self Introduction", groupIndex: 2, videos: [{ title: "Creating Your First Impression", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Softskills+Foundation+-+Creating+Self-introduction/index_lms.html" }] },
  ],
  'sql': [
    { topic: "Introduction to Structured Query Language(SQL)", videos: [{ title: "Introduction to Structured Query Language(SQL)", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Introduction%20to%20Structured%20Query%20Language(SQL)/index_lms.html" }] },
    { topic: "Data Definition Language (DDL)", videos: [{ title: "Data Definition Language (DDL)", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Data%20Definition%20Language%20(DDL)/index_lms.html" }] },
    { topic: "Data Manipulation Language (DML)", videos: [{ title: "Data Manipulation Language (DML)", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Data%20Manipulation%20Language%20(DML)/index_lms.html" }] },
    { topic: "Constraints", videos: [{ title: "Constraints", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Constraints_/index_lms.html" }] },
    { topic: "Normalization", videos: [{ title: "Normalization", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/Normalization/index_lms.html" }] },
    { topic: "SQL Clauses", videos: [{ title: "SQL Clauses", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/SQL%20Clauses/index_lms.html" }] },
    { topic: "SQL Functions", videos: [{ title: "SQL Functions", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/SQL%20Functions/index_lms.html" }] },
    { topic: "SQL Joins and Views", videos: [{ title: "SQL Joins and Views", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/SQL%20Joins%20and%20Views/index_lms.html" }] },
    { topic: "SQL Operators", videos: [{ title: "SQL Operators", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/SQL%20Operators/index_lms.html" }] },
    { topic: "SQL Sub-queries", videos: [{ title: "SQL Sub-queries", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/SQL%20Sub-queries/index_lms.html" }] },
    { topic: "TCL and DCL Commands", videos: [{ title: "TCL and DCL Commands", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/TCL%20and%20DCL%20Commands_/index_lms.html" }] },
  ],
  'react.js': [
    { topic: "Introduction to ReactJS", videos: [{ title: "Introduction to ReactJS", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/Introduction+to+ReactJs/index_lms.html" }] },
    { topic: "ReactJS – Environment Setup", videos: [{ title: "ReactJS – Environment Setup", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+-+Environment+Setup/index_lms.html" }] },
    { topic: "ReactJS Components", videos: [{ title: "ReactJS Components", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Components/index_lms.html" }] },
    { topic: "ReactJS Component Life Cycle", videos: [{ title: "ReactJS Component Life Cycle", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Component+Life+Cycle/index_lms.html" }] },
    { topic: "ReactJS Hooks", videos: [{ title: "ReactJS Hooks", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Hooks/index_lms.html" }] },
    { topic: "ReactJS Forms and UI", videos: [{ title: "ReactJS Forms and UI", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Forms+and+UI/index_lms.html" }] },
    { topic: "ReactJS Router", videos: [{ title: "ReactJS Router", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Router/index_lms.html" }] },
    { topic: "ReactJS Conditional Rendering", videos: [{ title: "ReactJS Conditional Rendering", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Conditional+Rendering/index_lms.html" }] },
    { topic: "ReactJS Event Handling", videos: [{ title: "ReactJS Event Handling", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Event+Handling/index_lms.html" }] },
    { topic: "ReactJS Styles", videos: [{ title: "ReactJS Styles", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Styles/index_lms.html" }] },
    { topic: "ReactJS Unit Testing & API Integration", videos: [{ title: "ReactJS Unit Testing & API Integration", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/React/ReactJS+Unit+Testing++API%C2%A0Integration/index_lms.html" }] },
  ],
  "javascript & es6": [
    { topic: "Introduction to Scalable Vector Graphics (SVG)", videos: [{ title: "Introduction to Scalable Vector Graphics (SVG)", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/Introduction+to+Scalable+Vector+Graphics+(SVG)/index_lms.html" }] },
    { topic: "SVG - Shape Properties", videos: [{ title: "SVG - Shape Properties", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/SVG+-+Shape+Properties/index_lms.html" }] },
    { topic: "Introduction to Responsive Web Designs", videos: [{ title: "Introduction to Responsive Web Designs", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/Introduction+to+Responsive+Web+Designs/index_lms.html" }] },
    { topic: "Introduction to Media Queries", videos: [{ title: "Introduction to Media Queries", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/Introduction+to+Media+Queries/index_lms.html" }] },
    { topic: "Implementation of Web Applications Using Media Queries", videos: [{ title: "Implementation of Web Applications Using Media Queries", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/Implementation+of+Web+Applications+Using+Media+Queries/index_lms.html" }] },
    { topic: "Introduction to JavaScript", videos: [{ title: "Introduction to JavaScript", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/Introduction+to+JavaScript/index_lms.html" }] },
    { topic: "JavaScript - Working with Data Types and Operators", videos: [{ title: "JavaScript - Working with Data Types and Operators", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/JavaScript+-+Working+with+Data+Types+and+Operators/index_lms.html" }] },
    { topic: "JavaScript - Control Statements", videos: [{ title: "JavaScript - Control Statements", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/JavaScript+%E2%80%93+Control+Statements/index_lms.html" }] },
    { topic: "JavaScript Validation & Regular Expressions", videos: [{ title: "JavaScript Validation & Regular Expressions", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/JavaScript+Validation++Regular+Expressions/index_lms.html" }] },
    { topic: "JavaScript Events", videos: [{ title: "JavaScript Events", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/JavaScript+Events/index_lms.html" }] },
    { topic: "Introduction to ECMAScript (ES6)", videos: [{ title: "Introduction to ECMAScript (ES6)", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/Introduction+to+ECMAScript+(ES6)/index_lms.html" }] },
    { topic: "ECMAScript (ES6) - Functions", videos: [{ title: "ECMAScript (ES6) - Functions", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/ECMAScript(ES6)+-+Functions+(1)/index_lms.html" }] },
    { topic: "Introduction to JavaScript Object Notation (JSON)", videos: [{ title: "Introduction to JavaScript Object Notation (JSON)", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/Introduction+to+_JavaScript+Object+Notation(JSON)/index_lms.html" }] },
    { topic: "JSON - Objects", videos: [{ title: "JSON - Objects", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/javascript/JSON+-+Objects/index_lms.html" }] },
  ],
  "java exceptions & algorithms": [
    { topic: "Exception Handling Overview", videos: [{ title: "Exception Handling Overview", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/EXCEPTION+HANDLING+OVERVIEW/index_lms.html" }] },
    { topic: "Exception Handling Methods", videos: [{ title: "Exception Handling Methods", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/Exception+Handling+Methods/index_lms.html" }] },
    { topic: "Custom Exceptions", videos: [{ title: "Custom Exceptions", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/CUSTOM+EXCEPTIONS/index_lms.html" }] },
    { topic: "File Handling using Byte Streams", videos: [{ title: "File Handling using Byte Streams", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/FILE+HANDLING+USING+BYTE+STREAMS/index_lms.html" }] },
    { topic: "File Handling using Character Streams", videos: [{ title: "File Handling using Character Streams", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/FILE+HANDLING+USING+CHARACTER+STREAMS/index_lms.html" }] },
    { topic: "Multi Threading", videos: [{ title: "Multi Threading", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/MULTITHREADING/index_lms.html" }] },
    { topic: "Memory Management and Garbage Collection", videos: [{ title: "Memory Management and Garbage Collection", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/MEMORY%20MANAGEMENT%20AND%20GARBAGE%20COLLECTION/index_lms.html" }] },
    { topic: "Sorting Algorithms", videos: [{ title: "Sorting Algorithms", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/SORTING%20ALGORITHMS/index_lms.html" }] },
    { topic: "Searching Algorithms", videos: [{ title: "Searching Algorithms", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/SEARCHING%20ALGORITHMS/index_lms.html" }] },
    { topic: "Working with Large Datasets", videos: [{ title: "Working with Large Datasets", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/WORKING+WITH+LARGE+DATASETS/index_lms.html" }] },
    { topic: "UML Diagrams", videos: [{ title: "UML Diagrams", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/java_exception_algorithms/UML+DIAGRAMS/index_lms.html" }] }
  ],
  "spring boot": [
    { topic: "Introduction to Hibernate", videos: [{ title: "Introduction to Hibernate", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Introduction+to+Hibernate/index_lms.html" }] },
    { topic: "Hibernate Configuration", videos: [{ title: "Hibernate Configuration", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Hibernate+Configuration/index_lms.html" }] },
    { topic: "Hibernate CRUD Operations", videos: [{ title: "Hibernate CRUD Operations", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Hibernate+CRUD+Operations/index_lms.html" }] },
    { topic: "Hibernate Caching", videos: [{ title: "Hibernate Caching", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Hibernate+Caching/index_lms.html" }] },
    { topic: "Hibernate Collection Mapping", videos: [{ title: "Hibernate Collection Mapping", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Hibernate+Collection+Mapping/index_lms.html" }] },
    { topic: "Hibernate Association Mapping", videos: [{ title: "Hibernate Association Mapping", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Hibernate+Association+Mapping/index_lms.html" }] },
    { topic: "Hibernate Query Language", videos: [{ title: "Hibernate Query Language", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Hibernate+Query+Language/index_lms.html" }] },
    { topic: "JUnit Testing", videos: [{ title: "JUnit Testing", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/JUnit+Testing/index_lms.html" }] },
    { topic: "Introduction to Spring Framework", videos: [{ title: "Introduction to Spring Framework", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Introduction+to+Spring+_Framework/index_lms.html" }] },
    { topic: "Spring with Hibernate", videos: [{ title: "Spring with Hibernate", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Spring+with+Hibernate/index_lms.html" }] },
    { topic: "Spring with Hibernate Integration", videos: [{ title: "Spring with Hibernate Integration", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Spring+with+Hibernate/index_lms.html" }] },
    { topic: "Annotations in Spring MVC Framework", videos: [{ title: "Annotations in Spring MVC Framework", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Annotations+in+Spring+MVC+Framework/index_lms.html" }] },
    { topic: "Introduction to Spring Boot", videos: [{ title: "Introduction to Spring Boot", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Introduction+to+Spring+_Framework/index_lms.html" }] },
    { topic: "Introduction to Web Services", videos: [{ title: "Introduction to Web Services", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Introduction+to+Web+Services/index_lms.html" }] },
    { topic: "CRUD Operations in Spring Boot Using REST API", videos: [{ title: "CRUD Operations in Spring Boot Using REST API", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/CRUD+Operations+in+Spring+Boot+Using+REST+API/index_lms.html" }] },
    { topic: "Spring Security Part 1", videos: [{ title: "Spring Security Part 1", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Spring+Security+Part+1/index_lms.html" }] },
    { topic: "Spring Security Part 2", videos: [{ title: "Spring Security Part 2", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Spring+Security+Part+1/index_lms.html" }] },
    { topic: "Spring Boot with JSON Web Token (JWT)", videos: [{ title: "Spring Boot with JSON Web Token (JWT)", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Spring+Boot+with+JSON+Web+Token+(JWT)/index_lms.html" }] },
    { topic: "Introduction to Swagger", videos: [{ title: "Introduction to Swagger", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Introduction+to+Swagger/index_lms.html" }] },
    { topic: "Git and GitHub", videos: [{ title: "Git and GitHub", url: "https://d1sq67t1c2pewz.cloudfront.net/Staging/ScromPackages/springboot/Git+and+GitHub/index_lms.html" }] },
  ],
};

const getCourseId = (name: string): number => {
  const courseMap: Record<string, number> = {
    'html & css': 1,
    'python': 2,
    'java': 3,
    'sql': 4,
    'react.js': 6,
    'interview preparedness': 7,
    'javascript & es6': 5,
    'java exceptions & algorithms': 8,
    'spring boot': 9,
  };
  return courseMap[name.toLowerCase()] || 0;
};

const ScormPlayer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = useAuth();
  const [isInteracted, setIsInteracted] = React.useState(false);
  const webViewRef = useRef<WebView>(null);
  const { url: initialUrl, progress: initialProgress, courseId, courseName } = route.params as { url?: string; progress: number; courseId: number; courseName: string };
  const [currentProgress, setCurrentProgress] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);

  // Sidebar state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Topic-level progress state
  const [topicProgress, setTopicProgress] = useState<Record<number, number>>({});
  const [scormData, setScormData] = useState<Record<string, string>>({});
  const [courseProgressId, setCourseProgressId] = useState<number | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [topicSetupDone, setTopicSetupDone] = useState(false);
  const selectedTopicRef = useRef(0);
  selectedTopicRef.current = selectedTopicIndex;

  // Refs to avoid stale closures in callbacks
  const lastVisitedRef = useRef<number>(0);
  const [activeSlide, setActiveSlide] = useState(1);
  const activeSlideRef = useRef<number>(1);
  activeSlideRef.current = activeSlide;
  const [visitedSlides, setVisitedSlides] = useState<Set<string>>(new Set());
  const totalCountRef = useRef<number>(0);
  totalCountRef.current = totalCount;
  const topicProgressRef = useRef<Record<number, number>>({});
  topicProgressRef.current = topicProgress;
  // Flag: only allow DB saves after initial server load is done
  const serverLoadedRef = useRef(false);

  const courseContent = COURSE_DATA[courseName?.toLowerCase()] || [];
  const currentUrl = courseContent[selectedTopicIndex]?.videos[0]?.url || initialUrl;

  // Debug logging for course content loading
  console.log('📚 [SCORM PLAYER] Course loading:', {
    courseName,
    courseNameLower: courseName?.toLowerCase(),
    courseContentLength: courseContent.length,
    availableCourses: Object.keys(COURSE_DATA),
    selectedTopicIndex,
    currentUrl
  });

  const toggleSidebar = () => {
    const toValue = sidebarVisible ? 300 : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  // Parse Articulate bitstring from cmi.suspend_data
  // Extracts both the visited slides and the total slide count.
  const parseSuspendData = useCallback((data: string): { visited: number; total: number } | null => {
    try {
      console.log('🔍 [SCORM] Parsing suspend_data:', data);

      // In Articulate Storyline, suspend_data contains a bitstring (0s and 1s) representing slide progress.
      // It is often preceded by 'u' (e.g. '2u101000...')
      // We match all alphanumeric characters after 'u' and strictly verify they contain only '0' and '1'.
      const matchU = data.match(/u([0-9a-zA-Z]+)/);
      if (matchU) {
        const segment = matchU[1];
        if (/^[01]+$/.test(segment)) {
          const result = {
            visited: segment.split('').filter(c => c === '1').length,
            total: segment.length
          };
          console.log('✅ [SCORM] Parsed from u-prefixed bitstring:', result);
          return result;
        }
      }

      // Fallback: match any sequence of 0s and 1s of length >= 2 ONLY if it spans the entire string
      const matchRaw = data.match(/^([01]{2,})$/);
      if (matchRaw) {
        const bitstring = matchRaw[0];
        const result = {
          visited: bitstring.split('').filter(c => c === '1').length,
          total: bitstring.length
        };
        console.log('✅ [SCORM] Parsed from raw bitstring:', result);
        return result;
      }

      // NEW: Handle Interview Preparedness format (different Articulate encoding)
      // Format: 2o3m60708090a0b0c0d0e0f0g0~201$1001a12T0101201112012120131201412015120161201712018120191201a12~...
      // The segment after ~ contains slide visitation data in hex format
      const matchInterview = data.match(/~(\d+)\$(\w+)(\d+)([01]+)/);
      if (matchInterview) {
        // Try to extract bitstring from the format
        const hexSegment = matchInterview[2];
        const bitstringSegment = matchInterview[4];

        // If we have a bitstring segment, use it
        if (bitstringSegment && bitstringSegment.length >= 2) {
          const result = {
            visited: bitstringSegment.split('').filter(c => c === '1').length,
            total: bitstringSegment.length
          };
          console.log('✅ [SCORM] Parsed from Interview Preparedness bitstring segment:', result);
          return result;
        }

        // Otherwise, try to parse hex segment as slide indicators
        // The hex segment contains slide visitation data
        if (hexSegment) {
          // Count the number of unique slide indicators in the hex data
          // Each pair of hex digits represents a slide
          const slideCount = Math.ceil(hexSegment.length / 2);
          // Estimate visited based on non-zero values
          const visited = hexSegment.split('').filter(c => c !== '0').length / 2;
          const result = {
            visited: Math.round(visited),
            total: slideCount
          };
          console.log('✅ [SCORM] Parsed from Interview Preparedness hex segment:', result);
          return result;
        }
      }

      // Alternative: Look for any sequence of 0s and 1s in the data (not just at the start)
      const matchAnyBits = data.match(/([01]{5,})/);
      if (matchAnyBits) {
        const bitstring = matchAnyBits[1];
        const result = {
          visited: bitstring.split('').filter(c => c === '1').length,
          total: bitstring.length
        };
        console.log('✅ [SCORM] Parsed from embedded bitstring:', result);
        return result;
      }

      console.log('⚠️ [SCORM] Could not parse suspend_data, returning null');
    } catch (e) {
      console.error('❌ [SCORM] Error parsing suspend_data:', e);
    }
    return null;
  }, []);

  // Save the current topic progress to backend DB
  const saveTopicToDb = useCallback(async (topicIdx: number, progress: number) => {
    if (!userId || progress <= 0) return;
    try {
      console.log('💾 [DB] Attempting to save progress:', {
        topicIdx,
        progress,
        courseName,
        courseId: getCourseId(courseName),
        courseContentLength: courseContent.length,
        topicProgressRef: topicProgressRef.current
      });

      // Use the latest topicProgress from ref to compute overall
      const allProgress = { ...topicProgressRef.current, [topicIdx]: progress };
      const totalProg = Object.values(allProgress).reduce((a, b) => a + b, 0);
      let overall = courseContent.length > 0
        ? Math.round(totalProg / courseContent.length)
        : progress;

      // Safeguard: if user has seen some portion (totalProg > 0) but overall rounds down to 0, force it to 1%
      if (totalProg > 0 && overall === 0) {
        overall = 1;
      }

      // Fix: If all topics are completed (100% each), force overall to 100%
      const allTopicsCompleted = Object.values(allProgress).every(p => p === 100);
      if (allTopicsCompleted && overall !== 100) {
        overall = 100;
      }

      // Also force to 100 if total progress equals or exceeds 100 * number of topics
      if (totalProg >= courseContent.length * 100 && overall !== 100) {
        overall = 100;
      }

      const payload = {
        applicantId: userId,
        courseId: getCourseId(courseName),
        courseName: courseName || `Course ${courseId}`,
        overallProgress: overall,
        totalProgress: overall,
        topicIndex: topicIdx,
        topicName: courseContent[topicIdx]?.topic || '',
        topicProgress: progress,
      };

      console.log('💾 [DB] Saving progress payload:', payload);

      await ProgressService.saveProgress(payload);
      console.log(`💾 [DB] ✅ Topic ${topicIdx} → ${progress}% | Overall: ${overall}%`);
    } catch (error) {
      console.error('❌ [DB] Save failed:', error);
    }
  }, [userId, courseName, courseId, courseContent]);

  // Core progress updater — called whenever SCORM reports slide activity
  const updateProgressState = useCallback((visited: number, total: number) => {
    if (!total || total === 0 || visited < 0) return;

    // Dynamically adjust totalCount if a more accurate total is provided (e.g. > 1 when current is 1 or 10)
    if (total > 1 && total !== totalCountRef.current) {
      console.log(`🔄 [SCORM] Dynamically updating total subtopics: ${totalCountRef.current} → ${total}`);
      setTotalCount(total);
      totalCountRef.current = total;
    }

    const finalTotal = Math.max(total, 1);
    const progress = Math.min(Math.round((visited / finalTotal) * 100), 100);
    const idx = selectedTopicRef.current;
    const existing = topicProgressRef.current[idx] || 0;

    // Log slide number and count clearly to the console
    console.log(`Slide Number: ${activeSlideRef.current}`);
    console.log(`Slide Count: ${finalTotal}`);

    // Slide transition logging
    if (visited > lastVisitedRef.current) {
      console.log('----------------------------------------');
      console.log(`✅ [SCORM] SUBTOPIC ${lastVisitedRef.current} COMPLETED`);
      console.log(`🚀 [SCORM] MOVING TO SUBTOPIC: ${visited} / ${finalTotal}`);
      console.log(`📊 [SCORM] PROGRESS: ${progress}%`);
      console.log('----------------------------------------');
      lastVisitedRef.current = visited;
    }

    // Prevent regression of the UI progress bar and visited count compared to recorded/existing progress
    const activeProgress = Math.max(progress, existing);
    const activeVisited = Math.max(visited, Math.round((existing / 100) * finalTotal));

    setCurrentProgress(activeProgress);
    setVisitedCount(activeVisited);

    // Save and update state if progress is greater than existing (monotonic)
    if (progress > existing) {
      setTopicProgress(prev => ({ ...prev, [idx]: progress }));

      // Persist locally
      const progressKey = `articulate_course_${courseId}_topic_${idx}_progress`;
      AsyncStorage.setItem(progressKey, JSON.stringify({ visited: activeVisited, total: finalTotal })).catch(() => { });

      // Save to backend DB
      if (serverLoadedRef.current) {
        saveTopicToDb(idx, progress);
      }
    }
  }, [courseId, saveTopicToDb]);

  // Load initial progress from AsyncStorage for the active topic
  const loadInitialProgress = useCallback(async () => {
    try {
      const idx = selectedTopicRef.current;

      // 1. Load basic progress (visited/total)
      const progressKey = `articulate_course_${courseId}_topic_${idx}_progress`;
      const rawData = await AsyncStorage.getItem(progressKey);

      let savedVisited = 0;
      let savedTotal = 10;

      if (rawData) {
        const data = JSON.parse(rawData);
        const visited = typeof data.visited === "number" ? data.visited : data.visited?.length || 0;
        const total = data.total || visited || 10;
        savedVisited = visited;
        savedTotal = total;
        updateProgressState(visited, total);
      }

      // 1.5 Load visited slides Set
      const visitedSlidesKey = `visited_slides_${courseId}_topic_${idx}`;
      const savedVisitedSlides = await AsyncStorage.getItem(visitedSlidesKey);
      if (savedVisitedSlides) {
        const parsed = JSON.parse(savedVisitedSlides);
        if (Array.isArray(parsed)) {
          setVisitedSlides(new Set(parsed));
          // If we had no cached progress or visited is 0, we can use the visited slides count
          if (savedVisited === 0 && parsed.length > 0) {
            savedVisited = parsed.length;
            const finalTotal = Math.max(savedTotal, savedVisited);
            updateProgressState(savedVisited, finalTotal);
          }
        }
      } else {
        setVisitedSlides(new Set());
      }

      // 2. Load detailed SCORM data for resumption
      const scormKey = `scorm_data_${courseId}_topic_${idx}`;
      const savedScormData = await AsyncStorage.getItem(scormKey);
      if (savedScormData) {
        const parsedData = JSON.parse(savedScormData);
        setScormData(parsedData);

        // Restore active slide from lesson_location
        if (parsedData['cmi.core.lesson_location']) {
          const loc = parsedData['cmi.core.lesson_location'];
          const matchNum = loc.match(/\d+/);
          if (matchNum) {
            setActiveSlide(parseInt(matchNum[0], 10));
          }
        }

        // Inject into WebView if it's already loaded
        const injectScript = `
          if (window.API) {
            window.scormData = ${JSON.stringify(parsedData)};
            console.log('Restored SCORM data:', window.scormData);
          }
        `;
        webViewRef.current?.injectJavaScript(injectScript);
      }
    } catch (e) {
      console.log("Error parsing progress from AsyncStorage", e);
    }
  }, [courseId, updateProgressState]);

  // Save progress when exiting — includes topic-level data
  const saveProgress = async () => {
    try {
      if (!userId) return;

      const idx = selectedTopicRef.current;
      const topicProg = topicProgressRef.current[idx] || currentProgress;

      // Recalculate overall progress from all topics
      const updatedTopicProgress = { ...topicProgressRef.current, [idx]: topicProg };
      const totalProg = Object.values(updatedTopicProgress).reduce((a, b) => a + b, 0);
      const overall = courseContent.length > 0 ? Math.round(totalProg / courseContent.length) : topicProg;

      await ProgressService.saveProgress({
        applicantId: userId,
        courseId: getCourseId(courseName),
        courseName: courseName || `Course ${courseId}`,
        overallProgress: overall,
        totalProgress: overall,
        topicIndex: idx,
        topicName: courseContent[idx]?.topic || '',
        topicProgress: topicProg,
      });

      console.log('Progress saved successfully:', { courseId, idx, topicProg, overall });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // ── Load topic-level progress from backend on mount ──
  useEffect(() => {
    const loadTopicProgress = async () => {
      if (!userId) return;
      try {
        console.log('📡 [Backend Progress] Loading progress for:', {
          userId,
          courseName,
          courseNameLower: courseName?.toLowerCase(),
          courseId: getCourseId(courseName)
        });

        const applicantCourses = await ProgressService.getApplicantProgress(userId.toString());
        const courses = applicantCourses?.data?.data || applicantCourses?.data || applicantCourses || [];
        console.log('📡 [Backend Progress] All courses from API:', courses);

        const currentCourse = (Array.isArray(courses) ? courses : []).find(
          (c: any) => (c.courseName || c.course_name)?.toLowerCase() === courseName?.toLowerCase()
        );

        console.log('📡 [Backend Progress] Found current course:', currentCourse);

        if (currentCourse) {
          setCourseProgressId(currentCourse.id);

          const topicsRes = await ProgressService.getCourseTopics(currentCourse.id);
          console.log('📡 [Backend Topics] Raw response:', topicsRes);

          const topics = topicsRes?.data?.data || topicsRes?.data || topicsRes || [];
          console.log('📡 [Backend Topics] Parsed topics list:', topics);

          const progressMap: Record<number, number> = {};
          (Array.isArray(topics) ? topics : []).forEach((t: any) => {
            const idx = t.topicIndex !== undefined ? Number(t.topicIndex) : (t.topic_index !== undefined ? Number(t.topic_index) : NaN);
            const prog = t.topicProgress !== undefined ? t.topicProgress : (t.topic_progress !== undefined ? t.topic_progress : 0);
            if (!isNaN(idx)) {
              progressMap[idx] = prog;
            }
          });
          console.log('📡 [Backend Topics] Mapped subtopics progress map:', progressMap);
          setTopicProgress(progressMap);

          // Auto-select the first incomplete or unlocked topic
          const topicsList = Array.isArray(topics) ? topics : [];
          const sortedTopics = topicsList.sort((a: any, b: any) => {
            const aIdx = a.topicIndex !== undefined ? Number(a.topicIndex) : Number(a.topic_index || 0);
            const bIdx = b.topicIndex !== undefined ? Number(b.topicIndex) : Number(b.topic_index || 0);
            return aIdx - bIdx;
          });

          let nextTopicIndex = 0;
          for (let i = 0; i < courseContent.length; i++) {
            const prog = progressMap[i] || 0;
            const isPrevComplete = i === 0 || (progressMap[i - 1] || 0) >= 100;

            if (prog < 100 && isPrevComplete) {
              nextTopicIndex = i;
              break;
            }
          }

          console.log("🎯 Auto-navigating to topic index:", nextTopicIndex);
          setSelectedTopicIndex(nextTopicIndex);
          setCurrentProgress(progressMap[nextTopicIndex] || 0);
        } else {
          console.warn('⚠️ [Backend Progress] No course found for:', courseName);
        }
      } catch (err) {
        console.error('❌ Error loading topic progress:', err);
      } finally {
        setProgressLoaded(true);
        serverLoadedRef.current = true; // Allow DB writes from here on
      }
    };
    loadTopicProgress();
  }, [userId, courseName]);

  // ── Load manifest subtopic count + local progress when topic changes ──
  useEffect(() => {
    if (!progressLoaded) return;

    let cancelled = false;
    const idx = selectedTopicIndex;

    const setup = async () => {
      setTopicSetupDone(false);
      // Reset slide tracking for this topic
      lastVisitedRef.current = 0;
      activeSlideRef.current = 1;
      setActiveSlide(1);
      setVisitedSlides(new Set());

      // 1. Fetch manifest to get real subtopic count
      let subtopicCount = 0;
      if (currentUrl && currentUrl.startsWith('http')) {
        subtopicCount = await ScormService.countSubtopicsFromUrl(currentUrl);
      }
      const finalTotal = subtopicCount > 1 ? subtopicCount : (totalCount > 1 ? totalCount : 0);
      if (!cancelled) {
        setTotalCount(finalTotal);
        totalCountRef.current = finalTotal;
        console.log(`📚 [SCORM] Topic ${idx}: ${finalTotal} subtopics in menu`);
      }

      // 2. Load cached progress from Database and AsyncStorage
      try {
        let visited = 0;
        let total = finalTotal;

        const dbProgress = topicProgressRef.current[idx] || 0;
        const progressKey = `articulate_course_${courseId}_topic_${idx}_progress`;
        const scormKey = `scorm_data_${courseId}_topic_${idx}`;
        const visitedSlidesKey = `visited_slides_${courseId}_topic_${idx}`;

        if (dbProgress === 0) {
          // Database says progress is 0. Clear any local cache to allow a clean reset!
          console.log(`🧹 [SCORM] Database progress is 0. Clearing local cache for topic ${idx}`);
          await AsyncStorage.removeItem(progressKey).catch(() => { });
          await AsyncStorage.removeItem(scormKey).catch(() => { });
          await AsyncStorage.removeItem(visitedSlidesKey).catch(() => { });
        } else {
          // Database has progress > 0. Check local cache.
          visited = Math.round((dbProgress / 100) * finalTotal);

          const raw = await AsyncStorage.getItem(progressKey);
          if (raw) {
            const cached = JSON.parse(raw);
            const cv = cached.visited || 0;
            const ct = cached.total || finalTotal;
            const cachedProgress = ct > 0 ? Math.round((cv / ct) * 100) : 0;

            // If AsyncStorage has a higher progress, use it
            if (cachedProgress > dbProgress) {
              visited = cv;
              total = ct;
            }
          }

          // Load visited slides Set
          const savedVisited = await AsyncStorage.getItem(visitedSlidesKey);
          if (savedVisited) {
            const parsed = JSON.parse(savedVisited);
            if (Array.isArray(parsed) && !cancelled) {
              setVisitedSlides(new Set(parsed));
              if (visited === 0 && parsed.length > 0) {
                visited = parsed.length;
                total = Math.max(total, visited);
              }
            }
          }
        }

        // Apply initial progress if any
        if (visited > 0 && !cancelled) {
          updateProgressState(visited, total);
        } else if (dbProgress === 0 && !cancelled) {
          // Explicitly reset player states for 0 progress
          setCurrentProgress(0);
          setVisitedCount(0);
        }

        // 3. Load detailed SCORM data for resumption
        let activeScormData: Record<string, string> = {};
        if (dbProgress > 0) {
          const savedScorm = await AsyncStorage.getItem(scormKey);
          if (savedScorm) {
            activeScormData = JSON.parse(savedScorm);
          } else if (total > 0) {
            // Reconstruct baseline SCORM variables from database progress
            const dbVisited = Math.round((dbProgress / 100) * total);
            const bitstring = '1'.repeat(dbVisited) + '0'.repeat(Math.max(total - dbVisited, 0));
            activeScormData = {
              'cmi.core.lesson_location': `${dbVisited}`,
              'cmi.suspend_data': `2u${bitstring}`,
              'cmi.core.lesson_status': dbProgress >= 100 ? 'completed' : 'incomplete'
            };
          }
        }

        if (Object.keys(activeScormData).length > 0 && !cancelled) {
          setScormData(activeScormData);
          if (activeScormData['cmi.core.lesson_location']) {
            const loc = activeScormData['cmi.core.lesson_location'];
            const matchNum = loc.match(/\d+/);
            if (matchNum) {
              const activeSlideNum = parseInt(matchNum[0], 10);
              setActiveSlide(activeSlideNum);
              activeSlideRef.current = activeSlideNum;
            }
          }
        } else if (dbProgress === 0 && !cancelled) {
          setScormData({});
          setActiveSlide(1);
          activeSlideRef.current = 1;
        }

        if (!cancelled) {
          setTopicSetupDone(true);
        }
      } catch (e) {
        console.log('Error restoring progress/SCORM data', e);
        if (!cancelled) {
          setTopicSetupDone(true);
        }
      }
    };

    setup();
    return () => { cancelled = true; };
  }, [selectedTopicIndex, currentUrl, courseId, progressLoaded]);

  // Handle back button press
  useEffect(() => {
    const backHandler = () => {
      saveProgress();
      navigation.goBack();
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', backHandler);
    return () => backHandlerSubscription.remove();
  }, [userId, currentProgress]);

  const saveProgressAndExit = async () => {
    await saveProgress();
    navigation.goBack();
  };

  const injectedJS = `
    (function() {
      var scormData = ${JSON.stringify(scormData)};
      var isInitialized = false;
      var hasUserInteracted = false;
      window.parent = window;
      window.top = window;
      
      // User interaction tracking
      document.addEventListener('click', function() {
        hasUserInteracted = true;
        console.log('User interaction detected');
      }, { once: false });
      
      document.addEventListener('touchstart', function() {
        hasUserInteracted = true;
        console.log('Touch interaction detected');
      }, { once: false });
      
      // Simple audio enable function
      function enableAudio() {
        console.log('Enabling audio playback');
        var audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(function(element) {
          element.muted = false;
          element.volume = 1.0;
          element.play().then(function() {
            console.log('Audio playing successfully:', element.src);
          }).catch(function(error) {
            console.log('Audio play failed:', error);
          });
        });
      }
      
      // Auto-unmute and play after user interaction
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          var audioElements = document.querySelectorAll('audio, video');
          audioElements.forEach(function(element) {
            element.muted = false;
            element.volume = 1.0;
            console.log('Audio element found and unmuted:', element.src || element);
          });
          
          if (hasUserInteracted) {
            enableAudio();
          } else {
            console.log('Waiting for user interaction to enable audio');
            // Enable audio on first interaction
            var enableAudioOnce = function() {
              hasUserInteracted = true;
              enableAudio();
              document.removeEventListener('click', enableAudioOnce);
              document.removeEventListener('touchstart', enableAudioOnce);
            };
            document.addEventListener('click', enableAudioOnce, { once: true });
            document.addEventListener('touchstart', enableAudioOnce, { once: true });
          }
        }, 2000);
      });
      
      // Unified SCORM 1.2 / 2004 API implementation
      var scormAPI = {
        LMSInitialize: function() {
          isInitialized = true;
          console.log('SCORM 1.2 API Initialized');
          if (window.scormData) {
            scormData = Object.assign(scormData, window.scormData);
          }
          return "true";
        },
        Initialize: function() {
          return scormAPI.LMSInitialize();
        },

        LMSSetValue: function(key, value) {
          if (!isInitialized) return "false";
          scormData[key] = value;
          console.log('SCORM SetValue:', key, value);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'setValue', key: key, value: value })
            );
          }
          return "true";
        },
        SetValue: function(key, value) {
          return scormAPI.LMSSetValue(key, value);
        },

        LMSGetValue: function(key) {
          if (!isInitialized) return "";
          var val = scormData[key] || "";
          console.log('SCORM GetValue:', key, val);
          return val;
        },
        GetValue: function(key) {
          return scormAPI.LMSGetValue(key);
        },

        LMSCommit: function() {
          if (!isInitialized) return "false";
          console.log('SCORM Commit');
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'commit', data: scormData })
            );
          }
          return "true";
        },
        Commit: function() {
          return scormAPI.LMSCommit();
        },

        LMSFinish: function() {
          if (!isInitialized) return "false";
          console.log('SCORM Finish');
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'finish', data: scormData })
            );
          }
          return "true";
        },
        Finish: function() {
          return scormAPI.LMSFinish();
        },
        Terminate: function() {
          return scormAPI.LMSFinish();
        },

        LMSGetLastError: function() {
          return isInitialized ? "0" : "101";
        },
        GetLastError: function() {
          return scormAPI.LMSGetLastError();
        },

        LMSGetErrorString: function(errorCode) {
          return "No error";
        },
        GetErrorString: function(errorCode) {
          return "No error";
        },

        LMSGetDiagnostic: function(errorCode) {
          return "No error";
        },
        GetDiagnostic: function(errorCode) {
          return "No error";
        }
      };

      window.API = scormAPI;
      window.API_1484_11 = scormAPI;

      // Smart window.GetPlayer hook to intercept Articulate custom variables and trigger scripts
      (function() {
        var originalGetPlayer = window.GetPlayer;
        window.GetPlayer = function() {
          var player = null;
          if (originalGetPlayer) {
            player = originalGetPlayer();
          } else if (window.g_player) {
            player = window.g_player;
          }
          
          if (!player) {
            for (var i = 0; i < window.frames.length; i++) {
              try {
                if (window.frames[i].GetPlayer) {
                  player = window.frames[i].GetPlayer();
                  break;
                }
              } catch(e) {}
            }
          }
          
          if (player) {
            if (player.SetVar && !player.SetVar.isIntercepted) {
              var originalSetVar = player.SetVar;
              player.SetVar = function(name, val) {
                console.log('Intercepted player.SetVar:', name, val);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({ type: 'setValue', key: 'player_var_' + name, value: val })
                  );
                }
                return originalSetVar.apply(player, arguments);
              };
              player.SetVar.isIntercepted = true;
            }
            return player;
          }
          
          return {
            GetVar: function(name) { return window.scormData ? window.scormData[name] : ""; },
            SetVar: function(name, val) { 
              if (window.scormData) window.scormData[name] = val; 
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: 'setValue', key: 'player_var_' + name, value: val })
                );
              }
            }
          };
        };
      })();
      
      console.log('SCORM API injected successfully');
    })();
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 [SCORM] Received message:', data.type, data);

      if (data.type === 'setValue') {
        const { key, value } = data;
        console.log(`🔍 [SCORM] ${key} = "${value}"`);

        // 1. cmi.core.lesson_location → current slide identifier
        if (key === 'cmi.core.lesson_location') {
          console.log(`📍 lesson_location → active subtopic set to: "${value}"`);

          let slideNum = 1;
          const matchNum = value.match(/\d+/);
          if (matchNum) {
            slideNum = parseInt(matchNum[0], 10);
          }
          setActiveSlide(slideNum);
          activeSlideRef.current = slideNum;
          console.log(`Slide Number: ${slideNum}`);

          const idx = selectedTopicRef.current;
          const visitedSlidesKey = `visited_slides_${courseId}_topic_${idx}`;

          setVisitedSlides(prev => {
            const updated = new Set(prev);
            updated.add(value);
            const array = Array.from(updated);
            AsyncStorage.setItem(visitedSlidesKey, JSON.stringify(array)).catch(() => { });

            // If we don't have a valid parsed suspend_data progress (or if suspend_data is null),
            // we use the size of visitedSlides to determine the visited count!
            const total = totalCountRef.current || 10;
            const visitedCountVal = updated.size;

            // Dynamically adjust total count if the highest slide number or visited size exceeds totalCount
            const dynamicTotal = Math.max(total, visitedCountVal, slideNum);

            console.log(`📊 [SCORM] Using visited slides for progress: ${visitedCountVal}/${dynamicTotal}`);

            // Trigger progress state update
            updateProgressState(visitedCountVal, dynamicTotal);
            setVisitedCount(visitedCountVal);
            setTotalCount(dynamicTotal);
            totalCountRef.current = dynamicTotal;

            return updated;
          });
        }

        // 2. cmi.suspend_data → bitstring: count 1s = visited subtopics
        if (key === 'cmi.suspend_data') {
          const res = parseSuspendData(value);
          if (res) {
            console.log(`📦 suspend_data → ${res.visited} of ${res.total} subtopics visited`);
            if (res.total > 1 && res.total !== totalCountRef.current) {
              setTotalCount(res.total);
              totalCountRef.current = res.total;
            }
            // Use the exact visited count reported by suspend_data
            updateProgressState(res.visited, res.total);
          } else {
            console.warn('⚠️ [SCORM] suspend_data could not be parsed, value:', value);
          }
        }

        // 3. cmi.core.score.raw → numeric score (0–100)
        if (key === 'cmi.core.score.raw') {
          const score = parseFloat(value);
          if (!isNaN(score) && score > 0) {
            console.log(`🎯 score.raw → ${score}%`);
            updateProgressState(score, 100);
          }
        }

        // 4. cmi.core.lesson_status → completion state
        if (key === 'cmi.core.lesson_status') {
          console.log(`🏁 lesson_status → "${value}"`);
          if (value === 'completed' || value === 'passed') {
            const total = totalCountRef.current || 1;
            updateProgressState(total, total); // 100%
          }
        }

        // Persist all SCORM data locally
        const idx = selectedTopicRef.current;
        const scormKey = `scorm_data_${courseId}_topic_${idx}`;
        setScormData(prev => {
          const updated = { ...prev, [key]: value };
          AsyncStorage.setItem(scormKey, JSON.stringify(updated)).catch(() => { });
          return updated;
        });
        return;
      }

      if (data.type === 'commit' && data.data) {
        console.log('💾 [SCORM] Commit received:', data.data);
        // Also scan commit snapshot for the 4 keys as a fallback
        const snap = data.data as Record<string, string>;
        if (snap['cmi.core.lesson_status'] === 'completed' || snap['cmi.core.lesson_status'] === 'passed') {
          const total = totalCountRef.current || 1;
          updateProgressState(total, total);
        }
        return;
      }

      if (data.type === 'finish' && data.data) {
        const snap = data.data as Record<string, string>;
        const total = totalCountRef.current || 1;
        if (snap['cmi.core.lesson_status'] === 'completed' || snap['cmi.core.lesson_status'] === 'passed') {
          updateProgressState(total, total);
        }
        saveProgressAndExit();
        return;
      }

    } catch (error) {
      console.error('❌ [SCORM] Message error:', error);
    }
  };

  if (!progressLoaded || !topicSetupDone) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Resuming course progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.navHeaderRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.navBackButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.heading}>{courseName}</Text>
          </View>
          <TouchableOpacity
            onPress={toggleSidebar}
            style={styles.navBackButton}
          >
            <Ionicons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView Player */}
      <WebView
        ref={webViewRef}
        source={{
          uri: currentUrl || 'https://your-aws-url/index.html'
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode={'compatibility'}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsAirPlayForMediaPlayback={true}
        allowsPictureInPictureMediaPlayback={true}
        startInLoadingState={true}
        userAgent={'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        onMessage={handleMessage}
        onTouchStart={() => {
          setIsInteracted(true);
          console.log('WebView touched');
        }}
        onLoad={() => {
          console.log('SCORM Loaded - triggering audio enable and setting progress');
          setTimeout(() => {
            const script = `
              var audioElements = document.querySelectorAll('audio, video');
              audioElements.forEach(function(element) {
                element.muted = false;
                element.volume = 1.0;
                if (element.play) {
                  element.play().catch(function(error) {
                    console.log('Post-load audio failed:', error);
                  });
                }
              });
            `;
            webViewRef.current?.injectJavaScript(script);
          }, 3000);
        }}
        onLoadStart={() => console.log('SCORM Loading started')}
        onError={(error) => console.error('SCORM WebView Error:', error)}
        onHttpError={(error) => console.error('SCORM HTTP Error:', error)}
      />



      {/* Backdrop for closing sidebar */}
      {sidebarVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )}

      {/* Sidebar Drawer */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>{courseName}</Text>
          <View style={styles.overallProgressContainer}>
            <View style={[styles.overallProgressFill, { width: `${courseContent.length > 0 ? Math.round(Object.values(topicProgress).reduce((a, b) => a + b, 0) / courseContent.length) : 0}%` }]} />
          </View>
          <Text style={styles.overallProgressText}>
            {courseContent.length > 0 ? Math.round(Object.values(topicProgress).reduce((a, b) => a + b, 0) / courseContent.length) : 0}% Overall
          </Text>
        </View>
        <ScrollView style={styles.topicList}>
          {courseContent.map((topic, index) => {
            const tProgress = index === selectedTopicIndex ? Math.max(topicProgress[index] || 0, currentProgress) : (topicProgress[index] || 0);
            const isLocked = index > 0 && (topicProgress[index - 1] || 0) < 100 && (topicProgress[index] || 0) === 0;
            const isActive = selectedTopicIndex === index;
            const isComplete = tProgress >= 100;

            return (
              <TouchableOpacity
                key={index}
                disabled={isLocked}
                style={[styles.topicItem, isActive && styles.activeTopicItem, isLocked && styles.lockedTopicItem]}
                onPress={() => {
                  if (!isLocked) {
                    setSelectedTopicIndex(index);
                    setCurrentProgress(topicProgress[index] || 0);
                    toggleSidebar();
                  }
                }}
              >
                <View style={styles.topicRow}>
                  <Text style={styles.topicIcon}>
                    {isLocked ? '🔒' : isComplete ? '✅' : '▶️'}
                  </Text>
                  <Text style={[styles.topicText, isActive && styles.activeTopicText, isLocked && styles.lockedTopicText]}>
                    {index + 1}. {topic.topic}
                  </Text>
                </View>
                {!isLocked && (
                  <View style={styles.miniProgressContainer}>
                    <View style={[styles.miniProgressFill, { width: `${tProgress}%` }]} />
                  </View>
                )}

                {!isLocked && (
                  <Text style={styles.topicProgressText}>{tProgress}%</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBackButton: {
    padding: 4,
  },
  navBackButtonPlaceholder: {
    width: 32,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  toggleButton: {
    position: 'absolute',
    top: 90,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#fff',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    paddingTop: 60,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  topicList: {
    flex: 1,
  },
  overallProgressContainer: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginTop: 10,
    width: '100%',
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#E88D2A',
    borderRadius: 3,
  },
  overallProgressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  topicItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeTopicItem: {
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 3,
    borderLeftColor: '#E88D2A',
  },
  lockedTopicItem: {
    opacity: 0.5,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  topicText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  activeTopicText: {
    color: '#E88D2A',
    fontWeight: 'bold',
  },
  lockedTopicText: {
    color: '#bbb',
  },
  topicProgressText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  miniProgressContainer: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 8,
    width: '100%',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default ScormPlayer;