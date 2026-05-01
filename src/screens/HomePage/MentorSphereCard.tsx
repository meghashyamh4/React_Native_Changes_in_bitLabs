import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Dimensions, useWindowDimensions, ScrollView } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type MentorItem = {
  meetingId: string;
  mentorName: string;
  title: string;
  date: number[]; // [yyyy, mm, dd]
  startTime: number[]; // [hh, mm]
  durationMinutes?: number;
  duration?: number;
};

type MentorProps = {
  items: MentorItem[];
  loading?: boolean;
  onViewMore: () => void;
  onSelectMentor: (item: MentorItem) => void;
  defaultImages: any[];
  backgroundColor?: string;
  borderColor?: string;
};

export const MentorSphereCard: React.FC<MentorProps> = ({ items, loading, onViewMore, onSelectMentor, defaultImages, backgroundColor = '#FFF5E6', borderColor = '#EA7B20' }) => {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update currentTime every minute to refresh status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Build date in local time to avoid UTC shifts (matching MentorConnect logic)
  const buildStartDate = (dateArr?: number[], timeArr?: number[]) => {
    if (!Array.isArray(dateArr) || dateArr.length < 3) return null;
    const [y, m, d] = dateArr;
    const hh = Array.isArray(timeArr) ? (timeArr[0] ?? 0) : 0;
    const mm = Array.isArray(timeArr) ? (timeArr[1] ?? 0) : 0;
    // Build in local time to avoid UTC shifts
    const dt = new Date();
    dt.setFullYear(y);
    dt.setMonth((m ?? 1) - 1);
    dt.setDate(d);
    dt.setHours(hh, mm, 0, 0);
    return isNaN(dt.getTime()) ? null : dt;
  };

  // Compute status: "Active", "Upcoming", or "Expired" (matching MentorConnect logic)
  const computeStatus = (item: MentorItem): "Active" | "Upcoming" | "Expired" => {
    const start = buildStartDate(item.date, item.startTime);
    if (!start) return "Expired";
    
    const mins = Number(item.durationMinutes ?? item.duration ?? 60) || 60;
    const end = new Date(start.getTime() + mins * 60000);
    const now = currentTime;
    
    // Treat exact start time as Active (>= start && < end)
    if (now >= start && now < end) return "Active";
    if (now < start) return "Upcoming";
    return "Expired";
  };

  // Filter and sort: only Active and Upcoming, sorted by status then time
  const upcoming = useMemo(() => {
    if (!items) return [];
    
    const filtered = items
      .filter(i => i && computeStatus(i) !== "Expired");
    
    return filtered.slice().sort((a, b) => {
      const order = { Active: 1, Upcoming: 2, Expired: 3 };
      const sa = computeStatus(a);
      const sb = computeStatus(b);
      const diff = (order[sa] || 99) - (order[sb] || 99);
      if (diff !== 0) return diff;
      
      // Within same status, earlier start first
      const ta = buildStartDate(a.date, a.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const tb = buildStartDate(b.date, b.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  }, [items, currentTime]);

  return (
    <View style={[styles.mentorCard, { backgroundColor, borderColor }]}>
      <View style={styles.mentorTop}>
        <Text style={styles.h4}>Mentor Sphere</Text>
        <TouchableOpacity onPress={onViewMore}><Text style={styles.link}>View more</Text></TouchableOpacity>
      </View>

      <View style={styles.mentorHeadingsRow}>
        <Text style={styles.smallHeading}>Guiding Star</Text>
        <Text style={styles.smallHeading}>Realm of Insight</Text>
        <Text style={styles.smallHeading}>Insight Hour</Text>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 8 }}>
          {[0,1,2,3].map(i => (
            <View key={i} style={styles.skeletonItem} />
          ))}
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={upcoming}
            keyExtractor={(it) => it.meetingId}
            renderItem={({ item, index }) => {
              const dateObj = new Date(item.date[0], item.date[1]-1, item.date[2]);
              const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
              const hours = item.startTime[0];
              const minutes = String(item.startTime[1]).padStart(2, '0');
              const period = hours >= 12 ? 'pm' : 'am';
              const formattedTime = `${(hours % 12) || 12}:${minutes}${period}`;
              const defaultImg = defaultImages[index % defaultImages.length];

              return (
                <TouchableOpacity style={styles.mentorRow} onPress={() => onSelectMentor(item)}>
                  <View style={styles.mentorLeft}>
                    <Image source={defaultImg} style={styles.mentorAvatar} />
                    <Text 
                      style={[styles.mentorName, isTablet && styles.mentorNameTablet]} 
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.mentorName}
                    </Text>
                  </View>
                  <Text 
                    style={[styles.mentorTitle, isTablet && styles.mentorTitleTablet]} 
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>
                  <Text 
                    style={[styles.mentorTime, isTablet && styles.mentorTimeTablet]} 
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formattedDate}, {formattedTime}
                  </Text>
                </TouchableOpacity>
              );
            }}
            scrollEnabled={upcoming.length > 4}
            showsVerticalScrollIndicator={upcoming.length > 4}
            nestedScrollEnabled={true}
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
          />
        </View>
      )}
    </View>
  );
};

// ----- Styles -----
export const styles = StyleSheet.create({
  mentorCard: { 
    borderRadius: 12, 
    padding: wp('3%'), 
    marginVertical: hp('1%'),
    borderWidth: 1,
  },
  mentorTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: hp('1%') 
  },
  h4: { 
    fontSize: hp('2%'), 
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  link: { 
    color: '#EA7B20', 
    fontSize: hp('1.5%'), // Consistent link size
    fontFamily: 'PlusJakartaSans-Medium',
  },
  mentorHeadingsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: hp('1%'),
    paddingHorizontal: wp('1%'),
  },
  smallHeading: { 
    fontSize: hp('1.61%'), // Consistent body text size
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  skeletonItem: { 
    height: hp('5.5%'), 
    backgroundColor: '#f0f0f0', 
    borderRadius: 6, 
    marginBottom: hp('1%') 
  },
  listContainer: {
    maxHeight: hp('22%'), // Max height for ~4 items, scrollable if more
  },
  flatList: {
    flexGrow: 0,
  },
  flatListContent: {
    paddingBottom: 4,
  },
  mentorRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: hp('1.2%'), 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: wp('1%'),
  },
  mentorLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1.2,
    marginRight: wp('2%'),
    minWidth: 0, // Important for text truncation
  },
  mentorAvatar: { 
    width: wp('8%'), 
    height: wp('8%'), 
    borderRadius: wp('4%'), 
    marginRight: wp('2.5%'),
    minWidth: 32,
    minHeight: 32,
  },
  mentorName: { 
    fontSize: hp('1.6%'), // Consistent sub-heading size
    color: '#1A1A1A',
    flex: 1,
    minWidth: 0, // Important for text truncation
    fontFamily: 'PlusJakartaSans-Medium',
  },
  mentorNameTablet: {
    fontSize: hp('1.8%'),
  },
  mentorTitle: { 
    flex: 1.3, 
    textAlign: 'center', 
    fontSize: hp('1.5%'), // Consistent link size
    color: '#444',
    marginHorizontal: wp('1%'),
    minWidth: 0, // Important for text truncation
    fontFamily: 'PlusJakartaSans-Medium',
  },
  mentorTitleTablet: {
    fontSize: hp('1.7%'),
  },
  mentorTime: { 
    flex: 1.2, 
    textAlign: 'right', 
    fontSize: hp('1.5%'), // Consistent link size
    color: '#444',
    marginLeft: wp('1%'),
    minWidth: 0, // Important for text truncation
    fontFamily: 'PlusJakartaSans-Medium',
  },
  mentorTimeTablet: {
    fontSize: hp('1.7%'),
  },
});
