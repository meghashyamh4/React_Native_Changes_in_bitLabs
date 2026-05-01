




import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width: screenWidth } = Dimensions.get('window');

type ArenaCardProps = {
  characterImg: any;
  onEnterArena: () => void;
  backgroundColor?: string;
  borderColor?: string;
};

const ArenaCard: React.FC<ArenaCardProps> = ({ characterImg, onEnterArena, backgroundColor = '#fff', borderColor = '#EA7B20' }) => {
  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.inner}>

        {/* LEFT SIDE TEXT */}
        <View style={styles.textBox}>
          <Text style={styles.heading}>Compete. Learn. Win.</Text>

          <Text style={styles.description} >
            Take part in Arena's hackathons to test your coding skills and gain hands-on experience solving real problems.
          </Text>

          {/* Gradient Button */}
          <TouchableOpacity onPress={onEnterArena}>
            <LinearGradient
              colors={['#FBBB5C', '#E66A0E']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Enter Arena!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* RIGHT SIDE IMAGE */}
        <View style={styles.imageWrap}>
          <Image source={characterImg} style={styles.image} />
        </View>

      </View>
    </View>
  );
};

export default ArenaCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
    elevation: 3,
    borderWidth: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  textBox: {
    flex: 1,
    paddingRight: 10,
  },
  heading: {
    fontSize: hp('2%'), // Consistent card title size
    color: '#000',
    marginBottom: 6,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  description: {
    fontSize: hp('1.4%'), // Consistent body text size
    color: '#444',
    marginBottom: 10,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: hp('1.5%'), // Consistent button text size
    fontFamily: 'PlusJakartaSans-Medium',
  },
  imageWrap: {
    width: wp('40%'),
    height: hp('18%'),
    minWidth: 140,
    minHeight: 160,
    maxHeight: hp('20%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
