import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import SemiCircleProgress from '@components/progessBar/SemiCircularProgressBar'; // Adjust the import path as needed
import Alertcircle from '@assests/icons/Alertcircle'; // Adjust the import path as needed

type SkillMatchProbabilityProps = {
  percent: number;
  skillProgressText: string | null;
  perfectMatchSkills: string[];
  unmatchedSkills: string[];
};

const SkillMatchProbability: React.FC<SkillMatchProbabilityProps> = ({
  percent,
  skillProgressText,
  perfectMatchSkills,
  unmatchedSkills,
}) => {
  return (
    <View style={styles.jobCard}>
      <Text style={[styles.jobdestitle, {marginBottom: 16}]}>Skill Match Probability</Text>
      <Text style={styles.message}>
        The more the probability, the more are the chances to get hired.
      </Text>
    

      <View style={styles.progressWrapper} >
        <View style = { styles.semiContainer}>
          <SemiCircleProgress percentage={percent} />
          </View>
        
        <View style={styles.textContainer}>
           <Text style={styles.centeredText}>{skillProgressText}</Text>
        </View>
      </View>

      <View style={styles.skillsContainer}>
        {perfectMatchSkills.map((skill, index) => (
          <Text key={`perfect-${index}`} style={[styles.skillTag, styles.matchedSkills]}>
            {skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase()}
          </Text>
        ))}
        {unmatchedSkills.map((skill, index) => (
          <View
            key={`unmatched-${index}`}
            style={[styles.unmatchedSkillContainer, {flexDirection: 'row', alignItems: 'center'}]}>
            <Alertcircle
              height={16}
              width={16}
              style={[styles.unmatchedSkillIcon, {marginRight: 4}]}
            />
            <Text style={[styles.unmatchedSkill]}>
              {' '}
              {skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    margin: 12,
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  jobdestitle: {
    color: '#F46F16',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  message: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  centeredView: {
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: -11.5,
    //width:100,
    //alignItems:'center'
  },
  progressWrapper:{
       width: '100%',
        alignItems: 'center',
        // justifyContent:'center',
        marginVertical:10
  },
    semiContainer: {
    width: '5%',         // pick a percentage that fits your design
    alignItems: 'center',     // center the bar *and* the text within this block
  },
  centeredText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 30.27,
    flexWrap: 'nowrap', 
    color: '#000000',
  },
    textContainer: {
    width: '100%',
    alignItems: 'center',  // center text inside it
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  skillTag: {
    flex: 0,
    backgroundColor: '#F46F16',
    color: 'white',
    padding: 3,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  matchedSkills: {
    color: '#fff',
    backgroundColor: '#498C07',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  unmatchedSkillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BF2308',
    padding: 3,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  unmatchedSkill: {
    color: '#fff',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
  },
  unmatchedSkillIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
});

export default SkillMatchProbability;
