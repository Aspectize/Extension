
using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using System.ComponentModel;

using Aspectize.Core;

[assembly:AspectizeDALAssemblyAttribute]

namespace DBLogException
{
	public static partial class SchemaNames
	{
		public static partial class Entities
		{
			public const string LogException = "LogException";
		}
	}

	[SchemaNamespace]
	public class DomainProvider : INamespace
	{
		public string Name { get { return GetType().Namespace; } }
		public static string DomainName { get { return new DomainProvider().Name; } }
	}


	[DataDefinition]
	public class LogException : Entity, IDataWrapper
	{
		public static partial class Fields
		{
			public const string Id = "Id";
			public const string DateException = "DateException";
			public const string InfoTypeName = "InfoTypeName";
			public const string Message = "Message";
			public const string ApplicationName = "ApplicationName";
			public const string ServiceName = "ServiceName";
			public const string CommandName = "CommandName";
			public const string UserName = "UserName";
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

		[Data]
		public DateTime DateException
		{
			get { return getValue<DateTime>("DateException"); }
			set { setValue<DateTime>("DateException", value); }
		}

		[Data]
		public string InfoTypeName
		{
			get { return getValue<string>("InfoTypeName"); }
			set { setValue<string>("InfoTypeName", value); }
		}

		[Data]
		public string Message
		{
			get { return getValue<string>("Message"); }
			set { setValue<string>("Message", value); }
		}

		[Data]
		public string ApplicationName
		{
			get { return getValue<string>("ApplicationName"); }
			set { setValue<string>("ApplicationName", value); }
		}

		[Data]
		public string ServiceName
		{
			get { return getValue<string>("ServiceName"); }
			set { setValue<string>("ServiceName", value); }
		}

		[Data]
		public string CommandName
		{
			get { return getValue<string>("CommandName"); }
			set { setValue<string>("CommandName", value); }
		}

		[Data(IsNullable = true)]
		public string UserName
		{
			get { return getValue<string>("UserName"); }
			set { setValue<string>("UserName", value); }
		}

		[Data(DefaultValue = "")]
		public string UserAgent
		{
			get { return getValue<string>("UserAgent"); }
			set { setValue<string>("UserAgent", value); }
		}

	}

}


  
