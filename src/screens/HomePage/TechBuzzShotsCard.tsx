import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Video = {
  videoId: number;
  title: string;
  thumbnail_url?: string;
};

type TechBuzzShotsCardProps = {
  videos: Video[];
  loading: boolean;
  onViewMore: () => void;
  onVideoPress: (videoId: number) => void;
  backgroundColor?: string;
  borderColor?: string;
};

export const TechBuzzShotsCard: React.FC<TechBuzzShotsCardProps> = ({
  videos,
  loading,
  onViewMore,
  onVideoPress,
  backgroundColor = '#FFF5E6',
  borderColor = '#EA7B20',
}) => {
  const maxVideos = 4;
  const displayVideos = videos.slice(0, maxVideos);

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tech Buzz Shorts</Text>
        <TouchableOpacity onPress={onViewMore}>
          <Text style={styles.viewMoreLink}>View more</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.videosContainer}
        >
          {/* Skeleton loaders */}
          {Array.from({ length: maxVideos }).map((_, i) => (
            <View key={i} style={styles.skeletonThumb} />
          ))}
        </ScrollView>
      ) : displayVideos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.videosContainer}
        >
          {/* Video thumbnails */}
          {displayVideos.map((video) => (
            <TouchableOpacity
              key={video.videoId}
              style={styles.videoThumbContainer}
              onPress={() => onVideoPress(video.videoId)}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri: video.thumbnail_url || 'https://via.placeholder.com/120x80?text=No+Img',
                }}
                style={styles.thumbnail}
                onError={() => {
                  // Error handled by fallback URI in source
                }}
              />
              <View style={styles.videoOverlay}>
                <View style={styles.playIconContainer}>
                  <Icon name="play-circle-filled" size={24} color="#fff" />
                </View>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title || 'Untitled'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        // Empty state - centered message
        <View style={styles.emptyStateContainer}>
          <Icon name="video-library" size={48} color="#999" />
          <Text style={styles.emptyStateText}>No videos available</Text>
          <Text style={styles.emptyStateSubtext}>Check back later for new Tech Buzz Shorts</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: wp('3%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  title: {
    fontSize: hp('2%'),
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  viewMoreLink: {
    color: '#EA7B20',
    fontSize: hp('1.5%'),
    fontFamily: 'PlusJakartaSans-Medium',
  },
  videosContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  videoThumbContainer: {
    width: wp('28%'),
    height: hp('12%'),
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: wp('2%'),
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: wp('2%'),
    paddingTop: wp('1%'),
  },
  playIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: hp('0.5%'),
  },
  videoTitle: {
    color: '#fff',
    fontSize: hp('1.3%'),
    fontFamily: 'PlusJakartaSans-Medium',
  },
  skeletonThumb: {
    width: wp('28%'),
    height: hp('12%'),
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    marginRight: wp('2%'),
  },
  emptyStateContainer: {
    width: '100%',
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp('15%'),
  },
  emptyStateText: {
    color: '#666',
    fontSize: hp('2%'),
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: hp('1.5%'),
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: hp('1.5%'),
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
});

