import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DashBoard from '../screens/HomePage/Home';
// import Jobs from '../screens/HomePage/Jobs'; // Commented out
import Notification from '../screens/HomePage/Badge';
// import Resume from '../screens/HomePage/MyResume'; // Commented out
import Hackathon from '../screens/Hackathon/HackathonScreen';
import MentorConnect from '../screens/MentorConnect/MentorConnect';
import HomeIconSolid from '../assests/icons/HomeSolid';
import HomeIconOutline from '../assests/icons/HomeOutline';
// import JobsIconSolid from '../assests/icons/BriefcaseSolid'; // Commented out
// import JobsIconOutline from '../assests/icons/BriefcaseOutline'; // Commented out
import NotificationIconSolid from '../assests/icons/BellSolid';
import NotificationIconOutline from '../assests/icons/BellOutline';
// import ResumeIconSolid from '../assests/icons/NewpaperSolid'; // Commented out
// import ResumeIconOutline from '../assests/icons/NewpaperOutline'; // Commented out
import BlogIconSolid from '../assests/icons/BlogSolid';
import BlogIconOutline from '../assests/icons/BlogOutline';
import ArenaIconSolid from '../assests/icons/ArenaSolid';
import ArenaIconOutline from '../assests/icons/ArenaOutline';
import MentorSphereIconSolid from '../assests/icons/MentorSphereSolid';
import MentorSphereIconOutline from '../assests/icons/MentorSphereOutline';

import {RootStackParamList} from '@models/model';
import {RouteProp} from '@react-navigation/native';
import {createTabScreenOptions} from '../components/Navigation/TabConfig';
import ApplicantBlogsList from '../screens/HomePage/ApplicantBlogList';
import VerifiedVideosScreen from '../screens/Videos/videoScreen';
import NewpaperIconOutline from '../assests/icons/NewpaperOutline';
import NewpaperIconSolid from '../assests/icons/NewpaperSolid';
const Tabs = createBottomTabNavigator<RootStackParamList>();
type BottomTabRouteProp = RouteProp<RootStackParamList, 'BottomTab'>;
const BottomTab = ({route}: {route: BottomTabRouteProp}) => {
  const welcome = route.params;
  return (
    <Tabs.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '',
        tabBarInactiveTintColor: 'grey',
        tabBarLabelStyle: {fontSize: 12},
        tabBarStyle: {
          height: 77,
          paddingBottom: 10,
          paddingTop: 12,
          paddingLeft: 8,
          paddingRight: 8,
          gap: 7,
          boxShadow: '0px 0px 5px 0px #7F8EAA26',
        },
        tabBarLabel: ({focused}) => (
          <Text
            style={{
              color: focused ? 'black' : 'grey',
              fontSize: 10,
              marginBottom: 30,
              fontFamily: 'PlusJakartaSans-Bold',
            }}>
            {route.name}
          </Text>
        ),
      })}>
      <Tabs.Screen
        name="Home"
        component={DashBoard}
        initialParams={welcome}
        {...createTabScreenOptions(HomeIconOutline, HomeIconSolid)}
      />
      {/* <Tabs.Screen
        name="Jobs"
        component={Jobs}
        {...createTabScreenOptions(JobsIconOutline, JobsIconSolid)}
      /> */}
      <Tabs.Screen
        name="Hackathon"
        component={Hackathon}
        {...createTabScreenOptions(ArenaIconOutline, ArenaIconSolid)}
      />
      <Tabs.Screen
        name="Badges"
        component={Notification}
        {...createTabScreenOptions(NotificationIconOutline, NotificationIconSolid)}
      />
     <Tabs.Screen
  name="TechVibes"
  component={ApplicantBlogsList}
  {...createTabScreenOptions(BlogIconOutline, BlogIconSolid)}
/>
      <Tabs.Screen
        name="Mentor Sphere"
        component={MentorConnect}
        {...createTabScreenOptions(MentorSphereIconOutline, MentorSphereIconSolid)}
      />
      <Tabs.Screen
        name="Shorts"
        component={VerifiedVideosScreen}
        {...createTabScreenOptions(NewpaperIconOutline, NewpaperIconSolid)}
      />
    </Tabs.Navigator>
  );
};
export default BottomTab;

