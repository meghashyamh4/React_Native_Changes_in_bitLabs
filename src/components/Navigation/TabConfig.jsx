import TabIcon from './TabIcon';

export const createTabScreenOptions = (IconOutline, IconSolid) => ({
  options: {
    tabBarIcon: ({focused, color}) => (
      <TabIcon focused={focused} IconOutline={IconOutline} IconSolid={IconSolid} color={color} />
    ),
  },
});
