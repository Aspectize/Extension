
using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using System.ComponentModel;

using Aspectize.Core;

[assembly:AspectizeDALAssemblyAttribute]

namespace BasicAuth
{
	public static partial class SchemaNames
	{
		public static partial class Entities
		{
			public const string User = "User";
			public const string CurrentUser = "CurrentUser";
		}

		public static partial class Relations
		{
			public const string IsUser = "IsUser";
		}
	}

	[SchemaNamespace]
	public class DomainProvider : INamespace
	{
		public string Name { get { return GetType().Namespace; } }
		public static string DomainName { get { return new DomainProvider().Name; } }
	}


	[DataDefinition]
	public class User : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string UserName = "UserName";
			public const string Password = "Password";
			public const string DateLastLogin = "DateLastLogin";
			public const string UserAgent = "UserAgent";
		}

		void IDataWrapper.InitData(DataRow data, string namePrefix)
		{
			base.InitData(data, null);
		}

		[Data(IsPrimaryKey=true)]
		public Guid Id
		{
			get { return getValue<Guid>("Id"); }
			set { setValue<Guid>("Id", value); }
		}

		[Data(Size = 100, IsNullable = true)]
		public string UserName
		{
			get { return getValue<string>("UserName"); }
			set { setValue<string>("UserName", value); }
		}

		[Data(Size = 50, IsNullable = true, ServerOnly = true)]
[System.Xml.Serialization.XmlIgnore]
		public string Password
		{
			get { return getValue<string>("Password"); }
			set { setValue<string>("Password", value); }
		}

		[Data(IsNullable = true, ExcludeFromConcurrencyCheck = true)]
		public DateTime? DateLastLogin
		{
			get { return getValue<DateTime?>("DateLastLogin"); }
			set { setValue<DateTime?>("DateLastLogin", value); }
		}

		[Data(IsNullable = true, ServerOnly = true)]
[System.Xml.Serialization.XmlIgnore]
		public string UserAgent
		{
			get { return getValue<string>("UserAgent"); }
			set { setValue<string>("UserAgent", value); }
		}

	}

	[DataDefinition(MustPersist = false)]
	public class CurrentUser : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
		}

		void IDataWrapper.InitData(DataRow data, string namePrefix)
		{
			base.InitData(data, null);
		}

		[Data(IsPrimaryKey=true)]
		public Guid Id
		{
			get { return getValue<Guid>("Id"); }
			set { setValue<Guid>("Id", value); }
		}

	}

	[DataDefinition(MustPersist = false)]
	public class IsUser : DataWrapper, IDataWrapper, IRelation
	{
		void IDataWrapper.InitData(DataRow data, string namePrefix)
		{
			base.InitData(data, null);
		}

		[RelationEnd(Type = typeof(CurrentUser), Role = typeof(CurrentUser), Multiplicity = Multiplicity.ZeroOrOne)]
		public IEntity CurrentUser;

		[RelationEnd(Type = typeof(User), Role = typeof(User), Multiplicity = Multiplicity.One)]
		public IEntity User;

	}

}


  
