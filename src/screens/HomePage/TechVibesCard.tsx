import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type Blog = {
  id: number;
  title: string;
  imageUrl?: string;
  createdAt?: number[]; // [year, month, day, hour, minute]
};

type TechVibesCardProps = {
  blogs: Blog[];
  loading: boolean;
  error?: string | null;
  onExplore: () => void;
  onBlogPress: (blogId: number) => void;
  backgroundColor?: string;
  borderColor?: string;
};

export const TechVibesCard: React.FC<TechVibesCardProps> = ({
  blogs,
  loading,
  error,
  onExplore,
  onBlogPress,
  backgroundColor = '#FFF5E6',
  borderColor = '#EA7B20',
}) => {
  const formatCreatedAt = (arr?: number[]) => {
    if (!arr || !Array.isArray(arr) || arr.length < 3) return 'N/A';
    const [year, month, day] = arr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  const displayBlogs = blogs.slice(0, 3);

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tech Vibes</Text>
        <TouchableOpacity onPress={onExplore}>
          <Text style={styles.exploreLink}>Explore</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.blogsList}>
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.skeletonItem}>
              <View style={styles.skeletonImg} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonDate} />
              </View>
            </View>
          ))
        ) : error ? (
          <Text style={styles.errorMsg}>{error}</Text>
        ) : displayBlogs.length === 0 ? (
          <Text style={styles.noBlogs}>No blogs available</Text>
        ) : (
          displayBlogs.map((blog) => (
            <TouchableOpacity
              key={blog.id}
              style={styles.blogItem}
              onPress={() => onBlogPress(blog.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: blog.imageUrl || 'https://via.placeholder.com/82x60?text=No+Img',
                }}
                style={styles.blogThumbnail}
                onError={() => {
                  // Error handled by fallback URI in source
                }}
              />
              <View style={styles.vibeContent}>
                <Text 
                  style={styles.newsTitle} 
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {blog.title || 'Untitled'}
                </Text>
                <Text style={styles.newsDate}>{formatCreatedAt(blog.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
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
    fontSize: hp('2%'), // Consistent card title size
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Bold', // Consistent with other card titles
  },
  exploreLink: {
    color: '#EA7B20',
    fontSize: hp('1.5%'),
    fontFamily: 'PlusJakartaSans-Medium',
  },
  blogsList: {
    gap: hp('1%'),
  },
  blogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
    paddingLeft: wp('1%'),
  },
  blogThumbnail: {
    width: wp('20%'),
    height: hp('7%'),
    borderRadius: 6,
    marginRight: wp('2.5%'),
    resizeMode: 'cover',
  },
  vibeContent: {
    flex: 1,
    minWidth: 0, // Allows text to truncate properly
  },
  newsTitle: {
    fontSize: hp('1.6%'),
    color: '#1A1A1A',
    marginBottom: hp('0.3%'),
    fontFamily: 'PlusJakartaSans-Medium',
    flexShrink: 1, // Allows text to shrink and show ellipsis
  },
  newsDate: {
    fontSize: hp('1.3%'),
    color: '#666',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
  },
  skeletonImg: {
    width: wp('20%'),
    height: hp('7%'),
    backgroundColor: '#E8E8E8',
    borderRadius: 6,
    marginRight: wp('2.5%'),
  },
  skeletonContent: {
    flex: 1,
    gap: hp('0.5%'),
  },
  skeletonTitle: {
    height: hp('1.8%'),
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    width: '80%',
  },
  skeletonDate: {
    height: hp('1.2%'),
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    width: '50%',
  },
  errorMsg: {
    color: '#D9534F',
    fontSize: hp('1.5%'),
    textAlign: 'center',
    paddingVertical: hp('1%'),
    fontFamily: 'PlusJakartaSans-Medium',
  },
  noBlogs: {
    color: '#999',
    fontSize: hp('1.5%'),
    textAlign: 'center',
    paddingVertical: hp('1%'),
    fontFamily: 'PlusJakartaSans-Medium',
  },
});

